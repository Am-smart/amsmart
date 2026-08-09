import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { StudyProgressSummaryDTO, StudySessionDTO } from '@/lib/types';
import { EmptyState, StatCard } from '@/components/ui-legacy';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

interface StudyProgressViewProps {
  summary: StudyProgressSummaryDTO | null;
  sessions: StudySessionDTO[];
}

export const StudyProgressView: React.FC<StudyProgressViewProps> = ({ summary, sessions }) => {
  if (!summary || summary.total_sessions === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No study time logged yet"
        description="Open a lesson and your focused study time will be tracked here automatically."
      />
    );
  }

  const peak = Math.max(1, ...summary.daily.map((d) => d.focus_seconds));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total focus time" value={formatDuration(summary.total_focus_seconds)} color="blue" />
        <StatCard label="Study sessions" value={summary.total_sessions} />
        <StatCard label="Day streak" value={summary.streak_days} color="green" subtext="consecutive days" />
        <StatCard
          label="Daily average"
          value={formatDuration(Math.round(summary.total_focus_seconds / Math.max(1, summary.daily.length)))}
          color="amber"
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Daily focus</h2>
        <div className="flex h-40 items-end gap-1 overflow-x-auto rounded-lg border border-border bg-card p-4">
          {summary.daily.map((d) => (
            <div key={d.date} className="flex min-w-[18px] flex-1 flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(2, (d.focus_seconds / peak) * 100)}%` }}
                title={`${d.date}: ${formatDuration(d.focus_seconds)}`}
              />
              <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      {summary.per_course.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Time per course</h2>
          <ul className="space-y-3">
            {summary.per_course.map((c) => (
              <li key={c.course_id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium text-foreground">{c.course_title}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">{formatDuration(c.focus_seconds)}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(c.focus_seconds / Math.max(1, summary.total_focus_seconds)) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Recent sessions</h2>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {sessions.slice(0, 15).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{s.label || s.course_title || 'Study session'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.started_at).toLocaleString()}</p>
                </div>
                <span className="text-sm font-medium text-foreground">{formatDuration(s.focus_seconds)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
