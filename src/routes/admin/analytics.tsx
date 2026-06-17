import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { getUsers, getCourses } from '@/lib/api-actions';
import { AdminAnalytics } from "@/components/system/SystemMisc";

function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([getUsers(), getCourses()])
      .then(() => setIsLoading(false))
      .catch(err => {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="animate-pulse">Loading analytics...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <AdminAnalytics />;
}


export const Route = createFileRoute('/admin/analytics')({
  head: () => ({ meta: [{ title: "Admin — Analytics — SmartLMS" }] }),
  component: AnalyticsPage,
});
