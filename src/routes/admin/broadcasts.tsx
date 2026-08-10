import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { BroadcastManager } from '@/components/communication';
import { getCourses } from '@/lib/api-actions';
import type { CourseDTO } from '@/lib/types';

function BroadcastsPage() {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch((err) => {
        console.error('Failed to load courses:', err);
        setError('Failed to load courses');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="animate-pulse text-slate-500">Loading broadcast targets…</div>;
  if (error) return <div className="font-semibold text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Broadcasts</h1>
        <p className="text-sm text-slate-500">Send announcements to every user, a role, or a single course cohort.</p>
      </header>
      <BroadcastManager initialCourses={courses} />
    </div>
  );
}

export const Route = createFileRoute('/admin/broadcasts')({
  head: () => ({
    meta: [
      { title: 'Admin — Broadcasts — SmartLMS' },
      { name: 'description', content: 'Compose and send platform-wide, role-targeted, or course-scoped announcements.' },
    ],
  }),
  component: BroadcastsPage,
});
