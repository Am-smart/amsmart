import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions, getQuizSubmissions, getAntiCheatLogs } from '@/lib/api-actions';
import { AntiCheatRecord } from "@/components/system/AntiCheatRecord";
import { SubmissionDTO, QuizSubmissionDTO, AntiCheatLogDTO } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 100;

function AntiCheatPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatLogDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      Promise.all([
        getSubmissions({ studentId: user.id }),
        getQuizSubmissions(undefined, user.id),
        getAntiCheatLogs({ 
          userId: user.id, 
          limit: PAGE_SIZE,
          offset: currentPage * PAGE_SIZE
        })
      ])
        .then(([subs, quizSubs, logs]) => {
          setSubmissions(subs);
          setQuizSubmissions(quizSubs);
          setAntiCheatLogs(logs);
        })
        .catch(err => {
          console.error('Failed to load anti-cheat records:', err);
          setError('Failed to load anti-cheat records');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (antiCheatLogs.length === PAGE_SIZE) {
      setCurrentPage(currentPage + 1);
    }
  };

  const canGoPrev = currentPage > 0;
  const canGoNext = antiCheatLogs.length === PAGE_SIZE;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-slate-200 h-8 rounded w-40"></div>
        <div className="animate-pulse bg-slate-200 h-48 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AntiCheatRecord submissions={submissions} quizSubmissions={quizSubmissions} logs={antiCheatLogs} />

      {/* Pagination Controls */}
      {antiCheatLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page <span className="font-semibold">{currentPage + 1}</span> • 
            Showing <span className="font-semibold">{antiCheatLogs.length}</span> records
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!canGoPrev}
              className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export const Route = createFileRoute('/student/anti-cheat')({
  head: () => ({ meta: [{ title: "Student — Anti-cheat — SmartLMS" }] }),
  component: AntiCheatPage,
});
