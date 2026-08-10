import { createFileRoute } from '@tanstack/react-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { EmptyState, StatCard } from '@/components/ui-legacy';
import { getSupportTickets, updateSupportTicket } from '@/lib/api-actions';
import type { SupportTicketDTO } from '@/lib/types';

const STATUSES: SupportTicketDTO['status'][] = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-700',
};

function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicketDTO[]>([]);
  const [status, setStatus] = useState('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setTickets(await getSupportTickets());
      setError(null);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
      setError('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: string, next: SupportTicketDTO['status']) => {
    setSavingId(id);
    const res = await updateSupportTicket(id, {
      status: next,
      ...(next === 'resolved' ? { resolved_at: new Date().toISOString() } : {}),
    });
    setSavingId(null);
    if (res.success) await load();
    else setError(res.error || 'Failed to update ticket');
  };

  const filtered = useMemo(
    () => (status === 'all' ? tickets : tickets.filter((t) => t.status === status)),
    [tickets, status]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Support Desk</h1>
        <p className="text-sm text-slate-500">Triage user-submitted tickets and track resolution status.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUSES.map((s) => (
          <StatCard
            key={s}
            label={s.replace('_', ' ')}
            value={tickets.filter((t) => t.status === s).length}
            color={s === 'open' ? 'red' : s === 'resolved' ? 'green' : s === 'in_progress' ? 'amber' : 'default'}
          />
        ))}
      </div>

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field sm:w-52">
        <option value="all">All tickets</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      {isLoading ? (
        <div className="animate-pulse text-slate-500">Loading tickets…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets" description="Support requests submitted by students and teachers will appear here." />
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => (
            <article key={t.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900">{t.subject}</h2>
                  <p className="text-xs text-slate-500">
                    {t.user?.full_name || 'Unknown user'} · {new Date(t.created_at).toLocaleString()}
                    {t.category ? ` · ${t.category}` : ''}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.low}`}>{t.priority}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{t.message}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={savingId === t.id || t.status === s}
                    onClick={() => changeStatus(t.id, s)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                      t.status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/admin/support')({
  head: () => ({
    meta: [
      { title: 'Admin — Support Desk — SmartLMS' },
      { name: 'description', content: 'Triage and resolve support tickets submitted by students and instructors.' },
    ],
  }),
  component: SupportPage,
});
