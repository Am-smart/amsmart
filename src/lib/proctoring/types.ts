/**
 * Proctoring feature contracts (browser layer).
 *
 * Layer rules: this module is UI/browser-side only. It never talks to a
 * provider (Supabase/OCI) directly — every write goes through
 * `@/lib/api-actions`, which calls the versioned API, which calls the
 * service layer, which calls the data seam.
 */

import type { ViolationSeverity } from '@/lib/types';

export type ProctorFeature = 'webcam' | 'screen' | 'audio' | 'face' | 'noise' | 'fullscreen';

export interface ProctorConfig {
  /** Stable id that groups every event of one attempt. */
  sessionId: string;
  assessmentId?: string;
  assessmentType?: 'quiz' | 'assignment';
  assessmentTitle?: string;
  userEmail?: string;

  webcam?: boolean;
  screen?: boolean;
  audio?: boolean;
  faceDetection?: boolean;
  noiseDetection?: boolean;
  fullscreen?: boolean;

  /** ms between webcam stills. */
  snapshotInterval?: number;
  /** ms per screen/audio recording chunk. */
  chunkInterval?: number;
  /** ms between analysis ticks for face/noise heuristics. */
  analysisInterval?: number;
  /** Max violations buffered before an early flush. */
  batchSize?: number;
  /** ms between violation flushes. */
  flushInterval?: number;
  /** Snapshot longest edge in px. */
  snapshotMaxEdge?: number;
  snapshotQuality?: number;
  /** RMS threshold (0-1) above which noise is reported. */
  noiseThreshold?: number;
}

export interface ProctorEvent {
  kind: string;
  severity?: ViolationSeverity;
  message?: string;
  payload?: Record<string, unknown>;
  evidenceUrl?: string | null;
  timestamp?: string;
}

export interface ProctorStats {
  status: 'idle' | 'starting' | 'running' | 'paused' | 'stopped';
  startedAt: string | null;
  events: number;
  pendingEvents: number;
  snapshots: number;
  chunks: number;
  pendingUploads: number;
  failedUploads: number;
  features: ProctorFeature[];
}

export const PROCTOR_DEFAULTS = {
  snapshotInterval: 30_000,
  chunkInterval: 60_000,
  analysisInterval: 4_000,
  batchSize: 20,
  flushInterval: 10_000,
  snapshotMaxEdge: 640,
  snapshotQuality: 0.6,
  noiseThreshold: 0.28,
} as const;
