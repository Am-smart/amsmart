import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getQuizzes, getQuizSubmissions } from '@/lib/api-actions';
import { QuizzesList } from "@/components/assessments/QuizzesList";
import { QuizDTO, QuizSubmissionDTO } from '@/lib/types';
import dynamic from 'next/dynamic';
import { QuizResultModal } from '@/components/assessments/QuizResultModal';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const QuizView = dynamic(() => import("@/components/assessments/QuizView").then(m => m.QuizView), { ssr: false });

function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizDTO | null>(null);
  const [viewingResult, setViewingResult] = useState<{ quiz: QuizDTO, submission: QuizSubmissionDTO } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [myEnrollments, allQuizzes, mySubmissions] = await Promise.all([
          getEnrollments(user.id),
          getQuizzes(),
          getQuizSubmissions(undefined, user.id)
        ]);

        const enrolledIds = myEnrollments.map(e => e.course_id);
        setQuizzes(allQuizzes.filter(q => enrolledIds.includes(q.course_id) && q.status === 'published'));
        setSubmissions(mySubmissions);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && quizzes.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const quiz = quizzes.find(q => q.id === id);
        if (quiz) {
            // Validate availability before setting as active
            const now = new Date();
            const startAt = quiz.start_at ? new Date(quiz.start_at) : null;
            const endAt = quiz.end_at ? new Date(quiz.end_at) : null;
            const isNotStarted = startAt && now < startAt;
            const isEnded = endAt && now > endAt;

            const mySubs = submissions.filter(s => s.quiz_id === quiz.id && s.status === 'submitted');
            const canAttempt = mySubs.length < quiz.attempts_allowed;

            if (!isNotStarted && !isEnded && canAttempt) {
                setActiveQuiz(quiz);
            } else {
                console.warn('[Quiz] Deeplink rejected: Quiz is either not started, already closed, or maximum attempts reached.');
                // Clear the ID from URL to avoid repeated warnings/checks if needed, or just let it be
            }
        }
      }
    }
  }, [quizzes, submissions]);

  const handleViewResults = (quizId: string, submissionId: string) => {
      const quiz = quizzes.find(q => q.id === quizId);
      const sub = submissions.find(s => s.id === submissionId);
      if (quiz && sub) {
          setViewingResult({ quiz, submission: sub });
      }
  };

  return (
    <ErrorBoundary>
      {activeQuiz && (
        <QuizView
            quiz={activeQuiz}
            user={user!}
            onComplete={() => { setActiveQuiz(null); fetchData(); }}
            onCancel={() => setActiveQuiz(null)}
        />
      )}
      {viewingResult && (
          <QuizResultModal
              quiz={viewingResult.quiz}
              submission={viewingResult.submission}
              onClose={() => setViewingResult(null)}
          />
      )}
      <QuizzesList
          quizzes={quizzes}
          submissions={submissions}
          onStart={(quizId) => {
              const q = quizzes.find(item => item.id === quizId);
              if (q) setActiveQuiz(q);
          }}
          onViewResults={handleViewResults}
      />
    </ErrorBoundary>
  );
}


export const Route = createFileRoute('/student/quizzes')({
  head: () => ({ meta: [{ title: "Student — Quizzes — SmartLMS" }] }),
  component: QuizzesPage,
});
