import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { getCourses, getMaintenance } from '@/lib/api-actions';
import { dynamic } from '@/lib/next-compat';

const MaintenancePanel = dynamic(() => import('@/components/system/MaintenancePanel').then(mod => mod.MaintenancePanel), {
    loading: () => <div className="h-48 bg-slate-100 animate-pulse rounded-lg" />
});

const BroadcastManager = dynamic(() => import('@/components/communication/BroadcastManager').then(mod => mod.BroadcastManager), {
    loading: () => <div className="h-48 bg-slate-100 animate-pulse rounded-lg" />
});
import { CourseDTO } from '@/lib/types';
import { MaintenanceDTO } from '@/lib/types';

function MaintenancePage() {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const courseData = await getCourses();
      setCourses(courseData || []);
      const m = await getMaintenance();
      setMaintenance(m);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
      setError('Failed to load maintenance data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading maintenance settings...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <div className="space-y-8">
      <MaintenancePanel
        maintenance={maintenance}
        onToggle={fetchData}
      />
      <BroadcastManager
        initialCourses={courses}
      />
    </div>
  );
}


export const Route = createFileRoute('/admin/maintenance')({
  head: () => ({ meta: [{ title: "Admin — Maintenance — SmartLMS" }] }),
  component: MaintenancePage,
});
