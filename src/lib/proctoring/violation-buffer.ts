/**
 * Batches proctoring events into a single API write.
 *
 * Rationale: a proctored attempt can emit hundreds of low-severity
 * heartbeats. One row-per-request would hammer the API; this buffers and
 * flushes on size or interval, and force-flushes on page hide so evidence
 * is not lost when a student closes the tab.
 */

import { recordViolations } from '@/lib/api-actions';
import type { ProctorConfig, ProctorEvent } from './types';
import { PROCTOR_DEFAULTS } from './types';

interface WireViolation {
  session_id: string;
  assessment_id?: string | null;
  assessment_type: string;
  assessment_title?: string | null;
  user_email?: string | null;
  kind: string;
  severity?: string;
  message?: string | null;
  payload: Record<string, unknown>;
  evidence_url?: string | null;
  timestamp: string;
}

export class ViolationBuffer {
  private buffer: WireViolation[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;
  private recorded = 0;

  constructor(private readonly config: ProctorConfig) {}

  get pending(): number {
    return this.buffer.length;
  }

  get total(): number {
    return this.recorded;
  }

  start(): void {
    if (this.timer) return;
    const interval = this.config.flushInterval ?? PROCTOR_DEFAULTS.flushInterval;
    this.timer = setInterval(() => void this.flush(), interval);
  }

  push(event: ProctorEvent): void {
    this.buffer.push({
      session_id: this.config.sessionId,
      assessment_id: this.config.assessmentId ?? null,
      assessment_type: this.config.assessmentType ?? 'quiz',
      assessment_title: this.config.assessmentTitle ?? null,
      user_email: this.config.userEmail ?? null,
      kind: event.kind,
      ...(event.severity ? { severity: event.severity } : {}),
      message: event.message ?? null,
      payload: event.payload ?? {},
      evidence_url: event.evidenceUrl ?? null,
      timestamp: event.timestamp ?? new Date().toISOString(),
    });
    this.recorded += 1;
    const batchSize = this.config.batchSize ?? PROCTOR_DEFAULTS.batchSize;
    if (this.buffer.length >= batchSize) void this.flush();
  }

  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    this.flushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      const result = await recordViolations(batch);
      // Re-queue on failure so nothing is silently dropped.
      if (!result.success) this.buffer.unshift(...batch);
    } catch {
      this.buffer.unshift(...batch);
    } finally {
      this.flushing = false;
    }
  }

  async dispose(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    await this.flush();
  }
}
