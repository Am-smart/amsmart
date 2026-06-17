import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import dynamic from 'next/dynamic';
import { getEnrollments } from '@/lib/api-actions';

const PlannerView = dynamic(() => import("@/components/planner/PlannerView").then(mod => mod.PlannerView), {
    loading: () => <div className="p-8 flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Planner...</div>
});

function PlannerPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      getEnrollments(user.id)
        .then(() => setIsLoading(false))
        .catch(err => {
          console.error('Failed to load planner:', err);
          setError('Failed to load planner');
          setIsLoading(false);
        });
    }
  }, [user]);

  if (!user) return null;
  if (isLoading) return <div className="animate-pulse">Loading planner...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <PlannerView userId={user.id} />;
}


export const Route = createFileRoute('/student/planner')({
  head: () => ({ meta: [{ title: "Student — Planner — SmartLMS" }] }),
  component: PlannerPage,
});
