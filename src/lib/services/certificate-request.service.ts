import { certificateRequestDb } from '../database/certificate-request.db.server';
import { learningDb } from '../database/learning.db.server';
import { systemDb } from '../database/system.db.server';
import { CertificateRequestDomain, DEFAULT_CERTIFICATE_TEMPLATES } from '../domain/certificate.domain';
import { serviceRegistry } from './service-registry';
import { certificateService } from './certificate.service';
import { rbac } from '../auth/rbac';
import {
  CertificateRequest,
  CertificateRequestStatus,
  CertificateTemplate,
  User,
} from '../types';
import { ForbiddenError, NotFoundError, ConflictError, BadRequestError } from '../api-error';

/**
 * Certificate request workflow.
 *
 * student applies → course teacher recommends/declines → admin approves
 * (which issues the certificate) or declines.
 */
export class CertificateRequestService {
  /** Scope: students see their own, teachers see their courses', admins see all. */
  async list(
    currentUser: User,
    sessionId: string,
    filters: {
      userId?: string;
      courseId?: string;
      status?: string | string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CertificateRequest[]> {
    const scoped: typeof filters & { teacherId?: string } = { ...filters };
    if (currentUser.role === 'student') scoped.userId = currentUser.id;
    else if (currentUser.role === 'teacher') scoped.teacherId = currentUser.id;
    return certificateRequestDb.findAll(sessionId, scoped);
  }

  /** Student applies for a certificate in a course they are enrolled in. */
  async apply(
    currentUser: User,
    payload: { course_id: string; message?: string },
    sessionId: string
  ): Promise<CertificateRequest> {
    if (!payload?.course_id) throw new BadRequestError('Course is required');

    const course = await learningDb.findCourseById(payload.course_id, sessionId);
    if (!course) throw new NotFoundError('Course not found');

    const enrollment = await learningDb.findEnrollmentByCourseAndStudent(
      payload.course_id,
      currentUser.id,
      sessionId
    );
    if (!enrollment) throw new ForbiddenError('You are not enrolled in this course');

    const existingCert = await certificateService
      .list(currentUser, sessionId, { courseId: payload.course_id })
      .catch(() => []);
    if (existingCert.some((c) => !c.revoked_at)) {
      throw new ConflictError('You already have a certificate for this course');
    }

    const existing = await certificateRequestDb.findByUserAndCourse(
      currentUser.id,
      payload.course_id,
      sessionId
    );

    const base = {
      status: 'pending' as CertificateRequestStatus,
      message: (payload.message || '').slice(0, 1000) || null,
      decision_reason: null,
      teacher_note: null,
      reviewed_by: null,
      reviewed_at: null,
      teacher_reviewed_by: null,
      teacher_reviewed_at: null,
      certificate_id: null,
    };

    let request: CertificateRequest;
    if (existing) {
      if (CertificateRequestDomain.isOpen(existing.status)) {
        throw new ConflictError('You already have a pending request for this course');
      }
      if (existing.status === 'approved') {
        throw new ConflictError('This request was already approved');
      }
      request = await certificateRequestDb.update(existing.id, base, sessionId);
    } else {
      request = await certificateRequestDb.insert(
        { user_id: currentUser.id, course_id: payload.course_id, ...base },
        sessionId
      );
    }

    if (course.teacher_id) {
      await this.notify(
        course.teacher_id,
        'New certificate request',
        `${currentUser.full_name} requested a certificate for "${course.title}".`,
        sessionId
      );
    }
    return request;
  }

  /** Course teacher recommends the request to admins, or declines it. */
  async teacherReview(
    currentUser: User,
    id: string,
    decision: CertificateRequestStatus,
    note: string | undefined,
    sessionId: string
  ): Promise<CertificateRequest> {
    if (!rbac.can(currentUser, 'certificate:manage')) {
      throw new ForbiddenError('Not allowed to review certificate requests');
    }
    if (!CertificateRequestDomain.TEACHER_DECISIONS.includes(decision)) {
      throw new BadRequestError('Invalid decision');
    }

    const request = await this.getOwnedRequest(currentUser, id, sessionId);
    if (!CertificateRequestDomain.canTeacherReview(request.status)) {
      throw new ConflictError('This request has already been reviewed');
    }

    const updated = await certificateRequestDb.update(
      id,
      {
        status: decision,
        teacher_note: (note || '').slice(0, 1000) || null,
        teacher_reviewed_by: currentUser.id,
        teacher_reviewed_at: new Date().toISOString(),
        ...(decision === 'rejected'
          ? { decision_reason: (note || 'Declined by instructor').slice(0, 1000) }
          : {}),
      },
      sessionId
    );

    if (decision === 'rejected') {
      await this.notify(
        request.user_id,
        'Certificate request declined',
        `Your certificate request for "${request.courses?.title || 'your course'}" was declined.`,
        sessionId
      );
    } else {
      const admins = await systemDb.findAllUserIdsByRole('admin').catch(() => [] as string[]);
      await Promise.all(
        admins.map((adminId) =>
          this.notify(
            adminId,
            'Certificate request awaiting approval',
            `${request.users?.full_name || 'A student'} was recommended for a certificate in "${request.courses?.title || 'a course'}".`,
            sessionId
          )
        )
      );
    }
    return updated;
  }

  /** Admin makes the final decision; approval issues the certificate. */
  async adminDecide(
    currentUser: User,
    id: string,
    decision: CertificateRequestStatus,
    reason: string | undefined,
    sessionId: string,
    options: { template?: string; final_grade?: number | null } = {}
  ): Promise<CertificateRequest> {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenError('Only administrators can approve certificate requests');
    }
    if (!CertificateRequestDomain.ADMIN_DECISIONS.includes(decision)) {
      throw new BadRequestError('Invalid decision');
    }

    const request = await certificateRequestDb.findById(id, sessionId);
    if (!request) throw new NotFoundError('Certificate request not found');
    if (!CertificateRequestDomain.canAdminDecide(request.status)) {
      throw new ConflictError('This request has already been decided');
    }

    if (decision === 'rejected') {
      const updated = await certificateRequestDb.update(
        id,
        {
          status: 'rejected',
          decision_reason: (reason || 'Declined by administrator').slice(0, 1000),
          reviewed_by: currentUser.id,
          reviewed_at: new Date().toISOString(),
        },
        sessionId
      );
      await this.notify(
        request.user_id,
        'Certificate request declined',
        `Your certificate request for "${request.courses?.title || 'your course'}" was declined.`,
        sessionId
      );
      return updated;
    }

    const certificate = await certificateService.issue(
      currentUser,
      {
        user_id: request.user_id,
        course_id: request.course_id,
        final_grade: options.final_grade ?? null,
        template: options.template,
      },
      sessionId
    );

    const updated = await certificateRequestDb.update(
      id,
      {
        status: 'approved',
        decision_reason: (reason || '').slice(0, 1000) || null,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
        certificate_id: certificate.id,
      },
      sessionId
    );

    await this.notify(
      request.user_id,
      'Certificate approved',
      `Your certificate for "${request.courses?.title || 'your course'}" is ready to download.`,
      sessionId
    );
    return updated;
  }

  /** Templates are readable by any certificate viewer, writable by admins only. */
  async getTemplates(currentUser: User, sessionId: string): Promise<CertificateTemplate[]> {
    if (!rbac.can(currentUser, 'certificate:view')) throw new ForbiddenError('Not allowed');
    const stored = await certificateRequestDb.getTemplates(sessionId);
    return stored && stored.length
      ? stored
      : (DEFAULT_CERTIFICATE_TEMPLATES as unknown as CertificateTemplate[]);
  }

  async saveTemplates(
    currentUser: User,
    templates: CertificateTemplate[],
    sessionId: string
  ): Promise<CertificateTemplate[]> {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenError('Only administrators can manage certificate templates');
    }
    if (!Array.isArray(templates) || templates.length === 0) {
      throw new BadRequestError('At least one template is required');
    }
    const cleaned = templates.slice(0, 20).map((t, index) => {
      const id = (t.id || `template-${index + 1}`).trim().slice(0, 40);
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new BadRequestError('Template ids must be alphanumeric');
      return {
        id,
        name: (t.name || 'Untitled').slice(0, 80),
        title: (t.title || 'Certificate of Completion').slice(0, 120),
        accent: /^#[0-9a-fA-F]{6}$/.test(t.accent || '') ? t.accent : '#1e40af',
        body: (t.body || 'has successfully completed').slice(0, 200),
        is_default: !!t.is_default,
      };
    });
    if (!cleaned.some((t) => t.is_default)) cleaned[0].is_default = true;
    await certificateRequestDb.saveTemplates(cleaned, sessionId);
    return cleaned;
  }

  private async getOwnedRequest(
    currentUser: User,
    id: string,
    sessionId: string
  ): Promise<CertificateRequest> {
    const request = await certificateRequestDb.findById(id, sessionId);
    if (!request) throw new NotFoundError('Certificate request not found');
    if (currentUser.role === 'admin') return request;
    const course = await learningDb.findCourseById(request.course_id, sessionId);
    if (!course || !rbac.canManageCourse(currentUser, course)) {
      throw new ForbiddenError('You do not own this course');
    }
    return request;
  }

  private async notify(
    targetId: string,
    title: string,
    message: string,
    sessionId: string
  ): Promise<void> {
    try {
      await serviceRegistry.systemService.notifyUser(
        { target_id: targetId, n_title: title, n_msg: message, n_type: 'certificate' },
        sessionId
      );
    } catch {
      /* notifications must never block the workflow */
    }
  }
}

export const certificateRequestService = new CertificateRequestService();
