import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { StatCard } from '@/components/ui-legacy';
import { getCertificates, getCourses, getSupportTickets, getUsers, getViolations } from '@/lib/api-actions';
import type { CertificateDTO, CourseDTO, SupportTicketDTO, UserDTO, ViolationDTO } from '@/lib/types';

interface ReportRow {
  metric: string;
  value: number | string;
}

function toCsv(rows: ReportRow[]): string {
  return ['Metric,Value', ...rows.map((r) => `"${r.metric}",${r.value}`)].join('\n');
}

function ReportsPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [violations, setViolations] = useState<ViolationDTO[]>([]);
  const [tickets, setTickets] = useState<SupportTicketDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
    Promise.all([
      getUsers(),
      getCourses(),
      getCertificates({ limit: 500 }),
      getViolations({ since, limit: 500 }),
      getSupportTickets(),
    ])
      .then(([u, c, cert, v, t]) => {
        setUsers(u);
        setCourses(c);
        setCertificates(cert);
        setViolations(v);
        setTickets(t);
      })
      .catch((err) => {
        console.error('Failed to build reports:', err);
        setError('Failed to load report data');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const rows = useMemo<ReportRow[]>(() => [
    { metric: 'Total users', value: users.length },
    { metric: 'Students', value: users.filter((u) => u.role === 'student').length },
    { metric: 'Teachers', value: users.filter((u) => u.role === 'teacher').length },
    { metric: 'Admins', value: users.filter((u) => u.role === 'admin').length },
    { metric: 'Active users', value: users.filter((u) => u.active !== false).length },
    { metric: 'Total courses', value: courses.length },
    { metric: 'Published courses', value: courses.filter((c) => c.status === 'published').length },
    { metric: 'Certificates issued', value: certificates.length },
    { metric: 'Certificates revoked', value: certificates.filter((c) => c.revoked_at).length },
    { metric: 'Violations (30 days)', value: violations.length },
    { metric: 'Critical violations (30 days)', value: violations.filter((v) => v.severity === 'CRITICAL').length },
    { metric: 'Open support tickets', value: tickets.filter((t) => t.status === 'open').length },
    { metric: 'Resolved support tickets', value: tickets.filter((t) => t.status === 'resolved').length },
  ], [users, courses, certificates, violations, tickets]);

  const download = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartlms-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="animate-pulse text-slate-500">Compiling platform report…</div>;
  if (error) return <div className="font-semibold text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Reports</h1>
          <p className="text-sm text-slate-500">Consolidated snapshot of adoption, delivery, integrity, and support metrics.</p>
        </div>
        <button type="button" onClick={download} className="btn-primary flex items-center gap-2">
          <Download size={18} />
          Export CSV
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={users.length} color="blue" />
        <StatCard label="Courses" value={courses.length} color="green" />
        <StatCard label="Certificates" value={certificates.length} color="amber" />
        <StatCard label="Violations (30d)" value={violations.length} color="red" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr><th className="px-5 py-3">Metric</th><th className="px-5 py-3 text-right">Value</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.metric}>
                <td className="px-5 py-3 text-slate-700">{r.metric}</td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/admin/reports')({
  head: () => ({
    meta: [
      { title: 'Admin — Platform Reports — SmartLMS' },
      { name: 'description', content: 'Consolidated platform metrics for users, courses, certificates, integrity, and support.' },
    ],
  }),
  component: ReportsPage,
});
