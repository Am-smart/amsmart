import { createFileRoute } from '@tanstack/react-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ViolationsTable } from '@/components/proctoring';
import { StatCard } from '@/components/ui-legacy';
import { getViolations } from '@/lib/api-actions';
import type { ViolationDTO, ViolationSeverity } from '@/lib/types';

const SEVERITIES: (ViolationSeverity | 'ALL')[] = ['ALL', 'INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const RANGES = [
  { label: 'Last 24 hours', hours: 24 },
  { label: 'Last 7 days', hours: 24 * 7 },
  { label: 'Last 30 days', hours: 24 * 30 },
];

function ViolationsPage() {
  const [violations, setViolations] = useState<ViolationDTO[]>([]);
  const [severity, setSeverity] = useState<ViolationSeverity | 'ALL'>('ALL');
  const [hours, setHours] = useState(24 * 7);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const since = new Date(Date.now() - hours * 3600_000).toISOString();
      setViolations(await getViolations({ since, severity: severity === 'ALL' ? undefined : severity, limit: 500 }));
    } catch (err) {
      console.error('Failed to load violations:', err);
      setError('Failed to load violations');
    } finally {
      setIsLoading(false);
    }
  }, [hours, severity]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return violations;
    return violations.filter((v) =>
      [v.user_email, v.assessment_title, v.kind, v.message].some((f) => (f || '').toLowerCase().includes(q))
    );
  }, [violations, search]);

  const critical = filtered.filter((v) => v.severity === 'CRITICAL').length;
  const high = filtered.filter((v) => v.severity === 'HIGH').length;
  const students = new Set(filtered.map((v) => v.user_id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Integrity Violations</h1>
        <p className="text-sm text-slate-500">Audit trail of anti-cheat events captured across quizzes and assignments.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Events" value={filtered.length} color="blue" />
        <StatCard label="Critical" value={critical} color="red" />
        <StatCard label="High" value={high} color="amber" />
        <StatCard label="Students involved" value={students} color="default" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student, assessment, or event…"
          className="input-field flex-1"
        />
        <select value={severity} onChange={(e) => setSeverity(e.target.value as ViolationSeverity | 'ALL')} className="input-field sm:w-40">
          {SEVERITIES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All severities' : s}</option>)}
        </select>
        <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="input-field sm:w-44">
          {RANGES.map((r) => <option key={r.hours} value={r.hours}>{r.label}</option>)}
        </select>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {isLoading ? <div className="animate-pulse text-slate-500">Loading violations…</div> : <ViolationsTable violations={filtered} />}
    </div>
  );
}

export const Route = createFileRoute('/admin/violations')({
  head: () => ({
    meta: [
      { title: 'Admin — Integrity Violations — SmartLMS' },
      { name: 'description', content: 'Review and filter anti-cheat violation events recorded during assessments.' },
    ],
  }),
  component: ViolationsPage,
});
