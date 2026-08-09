import { Violation, ViolationSeverity } from '../types';

const SEVERITY_ORDER: ViolationSeverity[] = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/** Default severity per violation kind, ported from the legacy proctor engine. */
const KIND_SEVERITY: Record<string, ViolationSeverity> = {
  tab_switch: 'MEDIUM',
  window_blur: 'LOW',
  fullscreen_exit: 'HIGH',
  copy: 'HIGH',
  paste: 'CRITICAL',
  cut: 'HIGH',
  right_click: 'LOW',
  devtools: 'CRITICAL',
  print: 'HIGH',
  screenshot: 'HIGH',
  multiple_displays: 'MEDIUM',
  face_missing: 'MEDIUM',
  multiple_faces: 'HIGH',
  network_offline: 'LOW',
  rapid_answer: 'MEDIUM',
  session_start: 'INFO',
  heartbeat: 'INFO',
};

export class ProctoringDomain {
  static severityFor(kind: string): ViolationSeverity {
    return KIND_SEVERITY[kind] ?? 'LOW';
  }

  static isAtLeast(severity: ViolationSeverity, threshold: ViolationSeverity): boolean {
    return SEVERITY_ORDER.indexOf(severity) >= SEVERITY_ORDER.indexOf(threshold);
  }

  static validate(violation: Partial<Violation>): void {
    if (!violation.session_id) throw new Error('Proctoring session id is required');
    if (!violation.kind) throw new Error('Violation kind is required');
  }

  /**
   * Normalizes an incoming violation. `userId` is forced from the trusted
   * server-side session so a client can never attribute events to someone else.
   */
  static prepare(violation: Partial<Violation>, userId: string): Partial<Violation> {
    this.validate(violation);
    const kind = String(violation.kind);
    return {
      session_id: String(violation.session_id),
      user_id: userId,
      user_email: violation.user_email ?? null,
      assessment_id: violation.assessment_id ?? null,
      assessment_type: violation.assessment_type || 'quiz',
      assessment_title: violation.assessment_title ?? null,
      kind,
      severity: violation.severity && SEVERITY_ORDER.includes(violation.severity)
        ? violation.severity
        : this.severityFor(kind),
      message: violation.message ?? null,
      payload: violation.payload ?? {},
      evidence_url: violation.evidence_url ?? null,
      timestamp: violation.timestamp || new Date().toISOString(),
    };
  }

  /** Overall session risk score 0-100 from a violation set. */
  static riskScore(violations: Pick<Violation, 'severity'>[]): number {
    const weight: Record<ViolationSeverity, number> = {
      INFO: 0, LOW: 2, MEDIUM: 6, HIGH: 14, CRITICAL: 25,
    };
    const raw = violations.reduce((sum, v) => sum + (weight[v.severity] ?? 0), 0);
    return Math.min(100, raw);
  }
}
