import React from 'react';
import { Radio, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import type { ProctoredSessionDTO } from '@/lib/types';
import { EmptyState, StatCard } from '@/components/ui-legacy';

const STATUS_STYLES: Record<ProctoredSessionDTO['status'], string> = {
  clean: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-800',
  flagged: 'bg-red-100 text-red-700',
};

interface LiveProctoringConsoleProps {
  sessions: ProctoredSessionDTO[];
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated: Date | null;
}

export const LiveProctoringConsole: React.FC<LiveProctoringConsoleProps> = ({
  sessions,
  isRefreshing,
  onRefresh,
  lastUpdated,
}) => {
  const flagged = sessions.filter((s) => s.status === 'flagged').length;
  const online = sessions.filter((s) => s.is_online).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active sessions" value={sessions.length} color="blue" />
        <StatCard label="Online now" value={online} color="green" />
        <StatCard label="Flagged" value={flagged} color="red" />
        <StatCard
          label="Total violations"
          value={sessions.reduce((sum, s) => sum + s.violation_count, 0)}
          color="amber"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for first poll…'}
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No active proctored sessions"
          description="Students currently taking a proctored quiz or assignment will appear here in real time."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sessions.map((s) => (
            <li key={s.session_id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{s.user_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.user_email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[s.status]}`}>
                  {s.status}
                </span>
              </div>

              <p className="mt-3 truncate text-sm text-foreground">{s.assessment_title}</p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.assessment_type}</p>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Violations</dt>
                  <dd className="font-semibold text-foreground">{s.violation_count}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">High severity</dt>
                  <dd className="font-semibold text-foreground">{s.high_severity_count}</dd>
                </div>
              </dl>

              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                {s.is_online ? <Wifi size={14} className="text-emerald-600" /> : <WifiOff size={14} />}
                {s.is_online ? 'Active' : 'Idle'} · last seen {new Date(s.last_activity).toLocaleTimeString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
