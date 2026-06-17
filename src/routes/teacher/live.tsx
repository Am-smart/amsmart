import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import dynamic from 'next/dynamic';
import { getCourses, getLiveClasses } from '@/lib/api-actions';
import { LiveClassDTO } from '@/lib/types';

const LiveClassManager = dynamic(() => import("@/components/communication/LiveClassManager").then(mod => mod.LiveClassManager), {
    loading: () => <div className="p-8 flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Live Class Manager...</div>
});
import { CourseDTO } from '@/lib/types';

function LiveClassesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClassDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const data = await getLiveClasses(undefined, user.id);
      setLiveClasses(data || []);
    } catch (err) {
      console.error('Failed to load live classes:', err);
      setError('Failed to load live classes');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading live classes...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <LiveClassManager
        teacherId={user!.id}
        liveClasses={liveClasses}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}


export const Route = createFileRoute('/teacher/live')({
  head: () => ({ meta: [{ title: "Teacher — Live — SmartLMS" }] }),
  component: LiveClassesPage,
});
