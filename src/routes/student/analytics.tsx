import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { StudentAnalytics } from "@/components/system/StudentAnalytics";
import { EnrollmentDTO } from '@/lib/types';
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/types';

function AnalyticsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);

  useEffect(() => {
    if (user) {
        getEnrollments(user.id).then(setEnrollments);
        getSubmissions({ studentId: user.id }).then(setSubmissions);
        getQuizSubmissions(undefined, user.id).then(setQuizSubmissions);
    }
  }, [user]);

  return <StudentAnalytics submissions={submissions} quizSubmissions={quizSubmissions} enrollments={enrollments} />;
}


export const Route = createFileRoute('/student/analytics')({
  head: () => ({ meta: [{ title: "Student — Analytics — SmartLMS" }] }),
  component: AnalyticsPage,
});
