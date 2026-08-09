import { StudySession, StudyProgressSummaryDTO } from '../types';

const MAX_SESSION_SECONDS = 12 * 60 * 60;

export class StudyDomain {
  static validate(session: Partial<StudySession>): void {
    if (!session.user_id) throw new Error('User is required');
  }

  static prepare(session: Partial<StudySession>, userId: string): Partial<StudySession> {
    return {
      user_id: userId,
      course_id: session.course_id ?? null,
      lesson_id: session.lesson_id ?? null,
      label: session.label ?? null,
      started_at: session.started_at || new Date().toISOString(),
      ended_at: session.ended_at ?? null,
      focus_seconds: this.clampSeconds(session.focus_seconds),
      idle_seconds: this.clampSeconds(session.idle_seconds),
    };
  }

  static clampSeconds(value: unknown): number {
    const n = Math.floor(Number(value) || 0);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, MAX_SESSION_SECONDS);
  }

  /** Aggregate raw sessions into the shape the progress page renders. */
  static summarize(sessions: StudySession[]): StudyProgressSummaryDTO {
    const dailyMap = new Map<string, number>();
    const courseMap = new Map<string, { title: string; seconds: number }>();
    let totalFocus = 0;

    for (const s of sessions) {
      const seconds = this.clampSeconds(s.focus_seconds);
      totalFocus += seconds;

      const day = (s.started_at || '').slice(0, 10);
      if (day) dailyMap.set(day, (dailyMap.get(day) ?? 0) + seconds);

      if (s.course_id) {
        const existing = courseMap.get(s.course_id);
        courseMap.set(s.course_id, {
          title: s.courses?.title || existing?.title || 'Untitled course',
          seconds: (existing?.seconds ?? 0) + seconds,
        });
      }
    }

    const daily = Array.from(dailyMap.entries())
      .map(([date, focus_seconds]) => ({ date, focus_seconds }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_focus_seconds: totalFocus,
      total_sessions: sessions.length,
      streak_days: this.streak(daily.map((d) => d.date)),
      daily,
      per_course: Array.from(courseMap.entries())
        .map(([course_id, v]) => ({ course_id, course_title: v.title, focus_seconds: v.seconds }))
        .sort((a, b) => b.focus_seconds - a.focus_seconds),
    };
  }

  /** Consecutive-day streak ending today or yesterday. */
  static streak(dates: string[]): number {
    const set = new Set(dates);
    const cursor = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    if (!set.has(iso(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
      if (!set.has(iso(cursor))) return 0;
    }
    let streak = 0;
    while (set.has(iso(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
}
