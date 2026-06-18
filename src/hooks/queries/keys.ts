/**
 * Centralized query-key factory for all TanStack Query usage.
 *
 * Keep keys here so invalidations stay consistent across hooks and components.
 * Never inline `["something", id]` literals in components — import from here.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  notifications: (userId: string) => ["notifications", userId] as const,
  maintenance: ["maintenance"] as const,
  dashboard: {
    student: (userId: string) => ["dashboard", "student", userId] as const,
    teacher: (userId: string) => ["dashboard", "teacher", userId] as const,
    admin: ["dashboard", "admin"] as const,
  },
  courses: {
    all: ["courses"] as const,
    byTeacher: (teacherId: string) => ["courses", "teacher", teacherId] as const,
  },
  enrollments: (studentId: string) => ["enrollments", studentId] as const,
  assignments: {
    all: ["assignments"] as const,
    byCourse: (courseId: string) => ["assignments", "course", courseId] as const,
  },
  submissions: (filters: Record<string, string | undefined>) =>
    ["submissions", filters] as const,
  users: ["users"] as const,
  systemStats: ["system", "stats"] as const,
} as const;

export type QueryKeys = typeof queryKeys;