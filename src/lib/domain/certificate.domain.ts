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
