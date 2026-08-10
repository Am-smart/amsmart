import { createFileRoute } from '@tanstack/react-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LiveProctoringConsole } from '@/components/proctoring';
import { getActiveProctoredSessions } from '@/lib/api-actions';
import type { ProctoredSessionDTO } from '@/lib/types';

const POLL_MS = 5000;

function LiveProctoringPage() {
  const [sessions, setSessions] = useState<ProctoredSessionDTO[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsRefreshing(true);
    try {
      setSessions(await getActiveProctoredSessions());
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to load proctored sessions:', err);
      setError('Failed to load live proctoring sessions');
    } finally {
      inFlight.current = false;
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Live Proctoring</h1>
        <p className="text-sm text-slate-500">Real-time monitor of proctored assessment sessions (refreshes every 5s).</p>
      </header>
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      <LiveProctoringConsole
        sessions={sessions}
        isRefreshing={isRefreshing}
        onRefresh={load}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}

export const Route = createFileRoute('/admin/live-proctoring')({
  head: () => ({
    meta: [
      { title: 'Admin — Live Proctoring — SmartLMS' },
      { name: 'description', content: 'Monitor active proctored assessment sessions and integrity violations in real time.' },
    ],
  }),
  component: LiveProctoringPage,
});
