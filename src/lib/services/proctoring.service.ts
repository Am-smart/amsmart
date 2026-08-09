import { proctoringDb } from '../database/proctoring.db.server';
import { assessmentDb } from '../database/assessment.db.server';
import { learningDb } from '../database/learning.db.server';
import { ProctoringDomain } from '../domain/proctoring.domain';
import { rbac } from '../auth/rbac';
import { User, Violation, ProctoredSessionDTO } from '../types';
import { ForbiddenError, BadRequestError } from '../api-error';

const MAX_BATCH = 50;

export class ProctoringService {
  /**
   * Ingest a batch of client-detected violations. `user_id` is always taken
   * from the authenticated session — never from the request body.
   */
  async record(currentUser: User, violations: unknown, sessionId: string): Promise<{ recorded: number }> {
    const list = Array.isArray(violations) ? violations : [violations];
    if (!list.length) return { recorded: 0 };
    if (list.length > MAX_BATCH) throw new BadRequestError(`Too many violations in one batch (max ${MAX_BATCH})`);

    const prepared = list.map((v) =>
      ProctoringDomain.prepare(
        { ...(v as Partial<Violation>), user_email: currentUser.email },
        currentUser.id
      )
    );

    const recorded = await proctoringDb.insertMany(prepared, sessionId);
    return { recorded };
  }

  /**
   * Scope rules:
   *  - student: own violations only
   *  - teacher: violations on their own assessments
   *  - admin:   everything
   */
  async list(
    currentUser: User,
    sessionId: string,
    filters: {
      userId?: string;
      assessmentId?: string;
      proctorSessionId?: string;
      severity?: string;
      since?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Violation[]> {
    const scoped = { ...filters };

    if (currentUser.role === 'student') {
      scoped.userId = currentUser.id;
    } else if (currentUser.role === 'teacher') {
      if (!scoped.assessmentId) {
        // Teachers must scope to an assessment they own — no global feed.
        throw new BadRequestError('assessmentId is required');
      }
      await this.assertOwnsAssessment(currentUser, scoped.assessmentId, sessionId);
    } else if (currentUser.role !== 'admin') {
      throw new ForbiddenError('Not allowed');
    }

    return proctoringDb.findAll(sessionId, scoped);
  }

  /** Live monitoring console — admins only. */
  async activeSessions(currentUser: User, sessionId: string): Promise<ProctoredSessionDTO[]> {
    if (!rbac.can(currentUser, 'proctoring:monitor')) throw new ForbiddenError('Not allowed');
    return proctoringDb.findActiveSessions(sessionId);
  }

  async riskScore(currentUser: User, proctorSessionId: string, sessionId: string): Promise<{ score: number }> {
    const violations = await this.list(currentUser, sessionId, { proctorSessionId, limit: 500 });
    return { score: ProctoringDomain.riskScore(violations) };
  }

  private async assertOwnsAssessment(currentUser: User, assessmentId: string, sessionId: string): Promise<void> {
    const quiz = await assessmentDb.findQuizById(assessmentId, sessionId);
    const target = quiz ?? (await assessmentDb.findAssignmentById(assessmentId, sessionId));
    if (!target) throw new ForbiddenError('Assessment not found or not accessible');
    if (target.teacher_id === currentUser.id) return;
    if (target.course_id) {
      const course = await learningDb.findCourseById(target.course_id, sessionId);
      if (course && rbac.canManageCourse(currentUser, course)) return;
    }
    throw new ForbiddenError('You do not own this assessment');
  }
}

export const proctoringService = new ProctoringService();
