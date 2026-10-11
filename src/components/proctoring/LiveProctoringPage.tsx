import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LiveProctoringConsole } from './LiveProctoringConsole';
import { getActiveProctoredSessions } from '@/lib/api-actions';
import { exportToCSV } from '@/lib/report-utils';
import type { ProctoredSessionDTO } from '@/lib/types';

const POLL_MS = 5000;

interface Props {
  /** Subtitle tailored to the role (admins see all, teachers see their own assessments). */
  description: string;
}

/** Shared live-proctoring page body for every role that has `proctoring:monitor`. */
export const LiveProctoringPage: React.FC<Props> = ({ description }) => {
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

  const exportReport = () =>
    exportToCSV(
      sessions.map((s) => ({
        student: s.user_name,
        email: s.user_email,
        assessment: s.assessment_title,
        type: s.assessment_type,
        started_at: s.started_at,
        last_activity: s.last_activity,
        violations: s.violation_count,
        high_severity: s.high_severity_count,
        status: s.status,
        online: s.is_online ? 'yes' : 'no',
      })),
      `proctoring-report-${new Date().toISOString().slice(0, 10)}`,
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Proctoring</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={exportReport}
          disabled={sessions.length === 0}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Export report
        </button>
      </header>
      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      <LiveProctoringConsole sessions={sessions} isRefreshing={isRefreshing} onRefresh={load} lastUpdated={lastUpdated} />
    </div>
  );
};
