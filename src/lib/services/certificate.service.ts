import { certificateDb } from '../database/certificate.db.server';
import { learningDb } from '../database/learning.db.server';
import { systemDb } from '../database/system.db.server';
import { CertificateDomain } from '../domain/certificate.domain';
import { rbac } from '../auth/rbac';
import { Certificate, User } from '../types';
import { ForbiddenError, NotFoundError, ConflictError, BadRequestError } from '../api-error';

export class CertificateService {
  /**
   * Scope rules:
   *  - student: own certificates only (userId is forced to the caller)
   *  - teacher: certificates for courses they own
   *  - admin:   everything
   */
  async list(
    currentUser: User,
    sessionId: string,
    filters: { userId?: string; courseId?: string; limit?: number; offset?: number } = {}
  ): Promise<Certificate[]> {
    const scoped: typeof filters & { teacherId?: string } = { ...filters };

    if (currentUser.role === 'student') {
      scoped.userId = currentUser.id;
    } else if (currentUser.role === 'teacher') {
      scoped.teacherId = currentUser.id;
    }

    return certificateDb.findAll(sessionId, scoped);
  }

  async get(currentUser: User, id: string, sessionId: string): Promise<Certificate> {
    const cert = await certificateDb.findById(id, sessionId);
    if (!cert) throw new NotFoundError('Certificate not found');
    await this.assertCanView(currentUser, cert, sessionId);
    return cert;
  }

  /** Public, PII-light verification by code. No session required. */
  async verify(code: string): Promise<{
    valid: boolean;
    code: string;
    title: string;
    recipient_name: string;
    course_title: string;
    issued_at: string | null;
    revoked: boolean;
  } | null> {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed || trimmed.length > 64) throw new BadRequestError('Invalid certificate code');

    const cert = await certificateDb.findByCode(trimmed);
    if (!cert) return null;

    return {
      valid: CertificateDomain.isValid(cert),
      code: cert.code,
      title: cert.title || 'Certificate of Completion',
      recipient_name: cert.recipient_name || '',
      course_title: cert.course_title || '',
      issued_at: cert.issued_at ?? null,
      revoked: !!cert.revoked_at,
    };
  }

  /** Teachers issue for their own courses; admins for any course. */
  async issue(
    currentUser: User,
    payload: { user_id: string; course_id: string; final_grade?: number | null; template?: string; title?: string },
    sessionId: string
  ): Promise<Certificate> {
    if (!rbac.can(currentUser, 'certificate:manage')) throw new ForbiddenError('Not allowed to issue certificates');

    const course = await learningDb.findCourseById(payload.course_id, sessionId);
    if (!course) throw new NotFoundError('Course not found');
    if (!rbac.canManageCourse(currentUser, course)) throw new ForbiddenError('You do not own this course');

    const enrollment = await learningDb.findEnrollmentByCourseAndStudent(payload.course_id, payload.user_id, sessionId);
    if (!enrollment) throw new BadRequestError('Student is not enrolled in this course');

    const existing = await certificateDb.findByUserAndCourse(payload.user_id, payload.course_id, sessionId);
    if (existing && !existing.revoked_at) throw new ConflictError('Certificate already issued for this student and course');

    const recipient = await systemDb.findUserById(payload.user_id, sessionId);

    const prepared = CertificateDomain.prepare(
      {
        user_id: payload.user_id,
        course_id: payload.course_id,
        final_grade: payload.final_grade ?? null,
        template: payload.template,
        title: payload.title,
      },
      {
        issuedBy: currentUser.id,
        recipientName: recipient?.full_name,
        courseTitle: course.title,
      }
    );

    // Re-issue over a previously revoked certificate rather than duplicating.
    if (existing) {
      return certificateDb.update(existing.id, { ...prepared, revoked_at: null, revoked_reason: null }, sessionId);
    }
    return certificateDb.insert(prepared, sessionId);
  }

  async revoke(currentUser: User, id: string, reason: string | undefined, sessionId: string): Promise<Certificate> {
    if (!rbac.can(currentUser, 'certificate:manage')) throw new ForbiddenError('Not allowed to revoke certificates');
    const cert = await certificateDb.findById(id, sessionId);
    if (!cert) throw new NotFoundError('Certificate not found');
    await this.assertCanManage(currentUser, cert, sessionId);

    return certificateDb.update(
      id,
      { revoked_at: new Date().toISOString(), revoked_reason: reason ?? null },
      sessionId
    );
  }

  async remove(currentUser: User, id: string, sessionId: string): Promise<void> {
    if (currentUser.role !== 'admin') throw new ForbiddenError('Only admins can delete certificates');
    const cert = await certificateDb.findById(id, sessionId);
    if (!cert) throw new NotFoundError('Certificate not found');
    await certificateDb.remove(id, sessionId);
  }

  private async assertCanView(currentUser: User, cert: Certificate, sessionId: string): Promise<void> {
    if (currentUser.role === 'admin') return;
    if (cert.user_id === currentUser.id) return;
    if (currentUser.role === 'teacher') {
      const course = await learningDb.findCourseById(cert.course_id, sessionId);
      if (course && rbac.canManageCourse(currentUser, course)) return;
    }
    throw new ForbiddenError('Not allowed to view this certificate');
  }

  private async assertCanManage(currentUser: User, cert: Certificate, sessionId: string): Promise<void> {
    if (currentUser.role === 'admin') return;
    const course = await learningDb.findCourseById(cert.course_id, sessionId);
    if (!course || !rbac.canManageCourse(currentUser, course)) {
      throw new ForbiddenError('You do not own this course');
    }
  }
}

export const certificateService = new CertificateService();
