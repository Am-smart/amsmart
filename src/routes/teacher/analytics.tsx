import { createFileRoute } from '@tanstack/react-router';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import {
  getCourses,
  getEnrollments,
  getSubmissions,
  getQuizSubmissions,
  getAssignments,
  getQuizzes,
  getViolations,
} from '@/lib/api-actions';
import { TeacherAnalytics } from '@/components/system/TeacherAnalytics';
import type {
  AssignmentDTO,
  CourseDTO,
  EnrollmentDTO,
  QuizDTO,
  SubmissionDTO,
  QuizSubmissionDTO,
  ViolationDTO,
} from '@/lib/types';

interface AnalyticsData {
  courses: CourseDTO[];
  assignments: AssignmentDTO[];
  quizzes: QuizDTO[];
  enrollments: EnrollmentDTO[];
  submissions: SubmissionDTO[];
  quizSubmissions: QuizSubmissionDTO[];
  violations: ViolationDTO[];
}

/** Fetch per course so each list stays inside the server page-size clamp. */
async function perCourse<T>(ids: string[], fetch: (id: string) => Promise<T[]>): Promise<T[]> {
  const lists = await Promise.all(ids.map((id) => fetch(id).catch(() => [] as T[])));
  const seen = new Set<string>();
  return lists.flat().filter((row) => {
    const id = (row as { id?: string }).id;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const courses = (await getCourses(user.id)) || [];
      const courseIds = courses.map((c) => c.id);
      const [assignments, quizzes, enrollments, submissions, quizSubmissions] = await Promise.all([
        perCourse(courseIds, (id) => getAssignments(undefined, id)),
        perCourse(courseIds, (id) => getQuizzes(id)),
        courseIds.length ? getEnrollments(undefined, courseIds) : Promise.resolve([]),
        perCourse(courseIds, (id) => getSubmissions({ courseId: id })),
        perCourse(courseIds, (id) => getQuizSubmissions(undefined, undefined, id)),
      ]);

      // Scope everything strictly to this teacher's own assessments.
      const assignmentIds = new Set(assignments.map((a) => a.id));
      const quizIds = new Set(quizzes.map((q) => q.id));
      const ownSubs = submissions.filter((s) => assignmentIds.has(s.assignment_id) && s.status !== 'draft');
      const ownQuizSubs = quizSubmissions.filter((s) => quizIds.has(s.quiz_id));

      // Security alerts are non-critical: a failure must not blank the page.
      const allViolations = await getViolations({ limit: 100 }).catch(() => [] as ViolationDTO[]);
      const violations = allViolations.filter(
        (v) => v.assessment_id && (assignmentIds.has(v.assessment_id) || quizIds.has(v.assessment_id)),
      );

      setData({
        courses,
        assignments,
        quizzes,
        enrollments: enrollments || [],
        submissions: ownSubs,
        quizSubmissions: ownQuizSubs,
        violations,
      });
    } catch (err) {
      console.error('Failed to load teaching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading && !data) return <div className="animate-pulse text-sm text-slate-500">Loading analytics...</div>;
  if (error || !data)
    return (
      <div className="bg-white p-8 rounded-3xl border border-red-100 space-y-4">
        <div className="text-red-600 font-semibold">{error || 'Failed to load analytics data'}</div>
        <button onClick={fetchData} className="btn-primary px-5 py-2 text-xs">
          Retry
        </button>
      </div>
    );

  return <TeacherAnalytics {...data} onRefresh={fetchData} isRefreshing={isLoading} />;
}

export const Route = createFileRoute('/teacher/analytics')({
  head: () => ({
    meta: [
      { title: 'Teacher — Analytics — SmartLMS' },
      { name: 'description', content: 'Course performance, grading load, and student progress analytics for teachers.' },
      { property: 'og:title', content: 'Teaching Analytics — SmartLMS' },
      { property: 'og:description', content: 'Track course progress, grading backlog, and average scores across your courses.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: TeacherAnalyticsPage,
});
