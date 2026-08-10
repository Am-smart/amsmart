import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { EmptyState, StatCard } from '@/components/ui-legacy';
import { getCourses, getUsers } from '@/lib/api-actions';
import type { CourseDTO, UserDTO } from '@/lib/types';

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft: 'bg-slate-100 text-slate-700',
  archived: 'bg-amber-100 text-amber-800',
};

function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [teachers, setTeachers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCourses(), getUsers()])
      .then(([courseList, users]: [CourseDTO[], UserDTO[]]) => {
        setCourses(courseList);
        setTeachers(Object.fromEntries(users.map((u) => [u.id, u.full_name])));
      })
      .catch((err) => {
        console.error('Failed to load course oversight data:', err);
        setError('Failed to load courses');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchesStatus = status === 'all' || c.status === status;
      const matchesQuery = !q || [c.title, c.description, teachers[c.teacher_id]].some((f) => (f || '').toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [courses, status, search, teachers]);

  if (isLoading) return <div className="animate-pulse text-slate-500">Loading course oversight…</div>;
  if (error) return <div className="font-semibold text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Course Oversight</h1>
        <p className="text-sm text-slate-500">Read-only view of every course on the platform and its owning instructor.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total courses" value={courses.length} color="blue" />
        <StatCard label="Published" value={courses.filter((c) => c.status === 'published').length} color="green" />
        <StatCard label="Drafts" value={courses.filter((c) => c.status === 'draft').length} color="amber" />
        <StatCard label="Archived" value={courses.filter((c) => c.status === 'archived').length} color="default" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course or instructor…" className="input-field flex-1" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field sm:w-44">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses match" description="Adjust the search term or status filter to see more courses." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <article key={c.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-slate-900">{c.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[c.status] ?? STATUS_STYLES.draft}`}>{c.status}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{c.description || 'No description provided.'}</p>
              <dl className="mt-4 space-y-1 text-xs text-slate-500">
                <div className="flex justify-between"><dt>Instructor</dt><dd className="font-semibold text-slate-700">{teachers[c.teacher_id] || 'Unassigned'}</dd></div>
                <div className="flex justify-between"><dt>Capacity</dt><dd className="font-semibold text-slate-700">{c.max_enrollment ?? '—'}</dd></div>
                <div className="flex justify-between"><dt>Created</dt><dd className="font-semibold text-slate-700">{c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/admin/courses')({
  head: () => ({
    meta: [
      { title: 'Admin — Course Oversight — SmartLMS' },
      { name: 'description', content: 'Platform-wide course inventory with instructor ownership, status, and capacity.' },
    ],
  }),
  component: AdminCoursesPage,
});
