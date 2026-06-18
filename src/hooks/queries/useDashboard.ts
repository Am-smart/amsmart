/**
 * Role-based dashboard data hooks backed by TanStack Query.
 *
 * - Single source of truth for dashboard reads; replaces the manual
 *   `refreshDashboardData` pattern.
 * - Caching, dedup, and background revalidation handled by Query.
 * - Use `useDashboardData(user)` for a unified interface keyed off role.
 */
import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import * as actions from "@/lib/api-actions";
import { queryKeys } from "./keys";
import type {
  User,
  CourseDTO,
  EnrollmentDTO,
  AssignmentDTO,
  SubmissionDTO,
  UserDTO,
} from "@/lib/types";

export interface DashboardSnapshot {
  stats: {
    courses: number;
    dueSoon: number;
    pendingGrading?: number;
    liveClasses?: number;
    totalUsers?: number;
    activeCourses?: number;
    flaggedUsers?: number;
    teachers?: number;
    students?: number;
    pendingResets?: number;
  };
  enrollments: EnrollmentDTO[];
  courses: CourseDTO[];
  assignments: AssignmentDTO[];
  submissions: SubmissionDTO[];
}

const EMPTY: DashboardSnapshot = {
  stats: { courses: 0, dueSoon: 0 },
  enrollments: [],
  courses: [],
  assignments: [],
  submissions: [],
};

const DEFAULT_STALE = 2 * 60 * 1000; // 2 min
const DEFAULT_GC = 10 * 60 * 1000; // 10 min

export function useStudentDashboard(
  userId: string | undefined,
  options: { enabled?: boolean } = {},
): UseQueryResult<DashboardSnapshot, Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.student(userId ?? ""),
    enabled: !!userId && (options.enabled ?? true),
    staleTime: DEFAULT_STALE,
    gcTime: DEFAULT_GC,
    queryFn: async (): Promise<DashboardSnapshot> => {
      const id = userId!;
      const [enrollments, allAssignments, submissions] = await Promise.all([
        actions.getEnrollments(id),
        actions.getAssignments(),
        actions.getSubmissions({ studentId: id }),
      ]);
      const enrolledIds = new Set(enrollments.map((e) => e.course_id));
      const now = Date.now();
      const submittedIds = new Set(submissions.map((s) => s.assignment_id));
      const pending = allAssignments.filter(
        (a) =>
          enrolledIds.has(a.course_id) &&
          new Date(a.due_date).getTime() > now &&
          !submittedIds.has(a.id),
      );
      return {
        stats: { courses: enrollments.length, dueSoon: pending.length },
        enrollments,
        courses: [],
        assignments: pending,
        submissions,
      };
    },
  });
}

export function useTeacherDashboard(
  userId: string | undefined,
  options: { enabled?: boolean } = {},
): UseQueryResult<DashboardSnapshot, Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.teacher(userId ?? ""),
    enabled: !!userId && (options.enabled ?? true),
    staleTime: DEFAULT_STALE,
    gcTime: DEFAULT_GC,
    queryFn: async (): Promise<DashboardSnapshot> => {
      const id = userId!;
      const [courses, submissions, liveClasses] = await Promise.all([
        actions.getCourses(id),
        actions.getSubmissions({ status: "submitted" }),
        actions.getLiveClasses(undefined, id),
      ]);
      return {
        stats: {
          courses: courses.length,
          pendingGrading: submissions.length,
          liveClasses: liveClasses.length,
          dueSoon: 0,
        },
        enrollments: [],
        courses,
        assignments: [],
        submissions,
      };
    },
  });
}

export function useAdminDashboard(
  options: { enabled?: boolean } = {},
): UseQueryResult<DashboardSnapshot, Error> {
  return useQuery({
    queryKey: queryKeys.dashboard.admin,
    enabled: options.enabled ?? true,
    staleTime: DEFAULT_STALE,
    gcTime: DEFAULT_GC,
    queryFn: async (): Promise<DashboardSnapshot> => {
      const [allUsers, systemStats] = await Promise.all([
        actions.getUsers(),
        actions.getSystemStats(),
      ]);
      const users: UserDTO[] = allUsers;
      return {
        stats: {
          courses: systemStats.courses ?? 0,
          dueSoon: 0,
          totalUsers: systemStats.users ?? users.length,
          activeCourses: systemStats.courses ?? 0,
          flaggedUsers: users.filter((u) => u.flagged).length,
          teachers: users.filter((u) => u.role === "teacher").length,
          students: users.filter((u) => u.role === "student").length,
          pendingResets: users.filter((u) => !!u.reset_request).length,
        },
        enrollments: [],
        courses: [],
        assignments: [],
        submissions: [],
      };
    },
  });
}

/**
 * Unified hook: picks the right role-specific dashboard query.
 * Always returns a stable `DashboardSnapshot` (empty until ready).
 */
export function useDashboardData(user: User | null): {
  data: DashboardSnapshot;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const queryClient = useQueryClient();

  const student = useStudentDashboard(user?.id, { enabled: user?.role === "student" });
  const teacher = useTeacherDashboard(user?.id, { enabled: user?.role === "teacher" });
  const admin = useAdminDashboard({ enabled: user?.role === "admin" });

  const active =
    user?.role === "student" ? student
    : user?.role === "teacher" ? teacher
    : user?.role === "admin" ? admin
    : null;

  return useMemo(() => {
    const refresh = async () => {
      if (!user) return;
      const key =
        user.role === "student" ? queryKeys.dashboard.student(user.id)
        : user.role === "teacher" ? queryKeys.dashboard.teacher(user.id)
        : user.role === "admin" ? queryKeys.dashboard.admin
        : null;
      if (key) await queryClient.invalidateQueries({ queryKey: key });
    };
    return {
      data: active?.data ?? EMPTY,
      isLoading: active?.isLoading ?? false,
      isFetching: active?.isFetching ?? false,
      error: (active?.error as Error | null) ?? null,
      refresh,
    };
  }, [active?.data, active?.isLoading, active?.isFetching, active?.error, user, queryClient]);
}