import { Certificate } from '../types';

/** Framework-agnostic certificate rules: code generation + validation. */
export class CertificateDomain {
  private static readonly ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  /** Human-readable, unambiguous verification code: SLMS-XXXX-XXXX-XXXX. */
  static generateCode(): string {
    const block = (n: number) =>
      Array.from({ length: n }, () => {
        const idx = Math.floor(Math.random() * this.ALPHABET.length);
        return this.ALPHABET[idx];
      }).join('');
    return `SLMS-${block(4)}-${block(4)}-${block(4)}`;
  }

  static validate(certificate: Partial<Certificate>): void {
    if (!certificate.user_id) throw new Error('Recipient is required');
    if (!certificate.course_id) throw new Error('Course is required');
  }

  static prepare(
    certificate: Partial<Certificate>,
    context: { issuedBy: string; recipientName?: string; courseTitle?: string }
  ): Partial<Certificate> {
    this.validate(certificate);
    return {
      ...certificate,
      code: certificate.code || this.generateCode(),
      template: certificate.template || 'default',
      title: certificate.title || 'Certificate of Completion',
      recipient_name: certificate.recipient_name || context.recipientName || null,
      course_title: certificate.course_title || context.courseTitle || null,
      issued_by: context.issuedBy,
      issued_at: certificate.issued_at || new Date().toISOString(),
    };
  }

  static isValid(certificate: Pick<Certificate, 'revoked_at'>): boolean {
    return !certificate.revoked_at;
  }
}

import { CertificateRequestStatus } from '../types';

/** Default templates shipped with the app; admins may override them. */
export const DEFAULT_CERTIFICATE_TEMPLATES = [
  {
    id: 'default',
    name: 'Classic',
    title: 'Certificate of Completion',
    accent: '#1e40af',
    body: 'has successfully completed',
    is_default: true,
  },
  {
    id: 'honours',
    name: 'Honours',
    title: 'Certificate of Achievement with Honours',
    accent: '#b45309',
    body: 'has completed with distinction',
  },
] as const;

/**
 * Request lifecycle: a student applies (`pending`), the course teacher
 * recommends it (`teacher_approved`) or rejects it, and an admin makes the
 * final call (`approved` issues the certificate, or `rejected`).
 */
export class CertificateRequestDomain {
  static readonly TEACHER_DECISIONS: CertificateRequestStatus[] = ['teacher_approved', 'rejected'];
  static readonly ADMIN_DECISIONS: CertificateRequestStatus[] = ['approved', 'rejected'];

  static canTeacherReview(status: CertificateRequestStatus): boolean {
    return status === 'pending';
  }

  static canAdminDecide(status: CertificateRequestStatus): boolean {
    return status === 'pending' || status === 'teacher_approved';
  }

  static canReapply(status: CertificateRequestStatus): boolean {
    return status === 'rejected';
  }

  static isOpen(status: CertificateRequestStatus): boolean {
    return status === 'pending' || status === 'teacher_approved';
  }

  static statusLabel(status: CertificateRequestStatus): string {
    switch (status) {
      case 'pending': return 'Awaiting instructor review';
      case 'teacher_approved': return 'Recommended — awaiting admin approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Declined';
      default: return status;
    }
  }
}
