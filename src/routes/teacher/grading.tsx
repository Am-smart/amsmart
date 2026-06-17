import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getSubmissions } from '@/lib/api-actions';
import { dynamic } from '@/lib/next-compat';
import { GradingQueue } from "@/components/assessments/GradingQueue";
import { SubmissionDTO } from '@/lib/types';

const GradingModal = dynamic(() => import("@/components/assessments/GradingModal").then(mod => mod.GradingModal), {
    loading: () => <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Grading View...</div>
});

function GradingPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchSubmissions = useCallback(async (page: number = 1) => {
    if (user) {
        setLoading(true);
        try {
            const data = await getSubmissions({
                status: 'submitted',
                limit: pagination.limit,
                offset: (page - 1) * pagination.limit
            });
            setSubmissions(data);
            // Since our API currently doesn't return total count in a wrapper,
            // we'll estimate or handle it if we had a count API.
            // For now, we'll keep the client-side list for the queue but with server limits.
        } finally {
            setLoading(false);
        }
    }
  }, [user, pagination.limit]);

  useEffect(() => {
    fetchSubmissions(pagination.page);
  }, [fetchSubmissions, pagination.page]);

  useEffect(() => {
    if (submissions.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const sub = submissions.find(s => s.id === id);
        if (sub) {
          setSelectedSubmission(sub);
        }
      }
    }
  }, [submissions]);

  return (
    <>
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <GradingQueue
            submissions={submissions}
            onGrade={setSelectedSubmission}
            onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
            currentPage={pagination.page}
        />
      </div>
      {selectedSubmission && (
          <GradingModal
              submission={selectedSubmission}
              onCancel={() => setSelectedSubmission(null)}
              onSave={async () => {
                  setSelectedSubmission(null);
                  fetchSubmissions();
              }}
          />
      )}
    </>
  );
}


export const Route = createFileRoute('/teacher/grading')({
  head: () => ({ meta: [{ title: "Teacher — Grading — SmartLMS" }] }),
  component: GradingPage,
});
