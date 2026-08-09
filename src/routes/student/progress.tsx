import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getStudySummary, getStudySessions } from '@/lib/api-actions';
import { StudyProgressView } from '@/components/progress';
import { Skeleton } from '@/components/ui-legacy';
import type { StudyProgressSummaryDTO, StudySessionDTO } from '@/lib/types';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

function StudentProgressPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<StudyProgressSummaryDTO | null>(null);
  const [sessions, setSessions] = useState<StudySessionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    Promise.all([
      getStudySummary({ userId: user.id, days }),
      getStudySessions({ userId: user.id, limit: 50 }),
    ])
      .then(([s, list]) => {
        setSummary(s);
        setSessions(list);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load study progress'))
      .finally(() => setIsLoading(false));
  }, [user, days]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Study Progress</h1>
          <p className="text-sm text-muted-foreground">Your focused study time, streaks, and per-course breakdown.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                days === r.days ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <StudyProgressView summary={summary} sessions={sessions} />
      )}
    </div>
  );
}

export const Route = createFileRoute('/student/progress')({
  head: () => ({ meta: [{ title: 'Student — Study Progress — SmartLMS' }] }),
  component: StudentProgressPage,
});
