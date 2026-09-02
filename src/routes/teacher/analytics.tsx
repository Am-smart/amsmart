import { createFileRoute } from '@tanstack/react-router';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { TeacherAnalytics } from '@/components/system/TeacherAnalytics';
import type { CourseDTO, EnrollmentDTO, SubmissionDTO, QuizSubmissionDTO } from '@/lib/types';

function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await getCourses(user.id);
      setCourses(myCourses || []);
      const courseIds = (myCourses || []).map((c) => c.id);
      const [enrols, subs, qSubs] = await Promise.all([
        courseIds.length ? getEnrollments(undefined, courseIds) : Promise.resolve([]),
        getSubmissions(),
        getQuizSubmissions(),
      ]);
      setEnrollments(enrols || []);
      setSubmissions(subs || []);
      setQuizSubmissions(qSubs || []);
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

  if (isLoading) return <div className="animate-pulse text-sm text-slate-500">Loading analytics...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <TeacherAnalytics
      courses={courses}
      enrollments={enrollments}
      submissions={submissions}
      quizSubmissions={quizSubmissions}
    />
  );
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
