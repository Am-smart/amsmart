import { studyDb } from '../database/study.db.server';
import { StudyDomain } from '../domain/study.domain';
import { rbac } from '../auth/rbac';
import { StudySession, StudyProgressSummaryDTO, User } from '../types';
import { ForbiddenError, NotFoundError } from '../api-error';

export class StudyService {
  /** Students may only read their own sessions; teachers/admins may target a student. */
  async list(
    currentUser: User,
    sessionId: string,
    filters: { userId?: string; courseId?: string; since?: string; limit?: number; offset?: number } = {}
  ): Promise<StudySession[]> {
    const targetUserId = this.resolveTarget(currentUser, filters.userId);
    return studyDb.findAll(sessionId, { ...filters, userId: targetUserId });
  }

  async summary(
    currentUser: User,
    sessionId: string,
    filters: { userId?: string; days?: number } = {}
  ): Promise<StudyProgressSummaryDTO> {
    const targetUserId = this.resolveTarget(currentUser, filters.userId);
    const days = Math.min(Math.max(Number(filters.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const sessions = await studyDb.findAll(sessionId, { userId: targetUserId, since, limit: 1000 });
    return StudyDomain.summarize(sessions);
  }

  /** Starts a session. Always attributed to the authenticated user. */
  async start(currentUser: User, payload: Partial<StudySession>, sessionId: string): Promise<StudySession> {
    const prepared = StudyDomain.prepare(payload, currentUser.id);
    return studyDb.insert(prepared, sessionId);
  }

  /** Ownership-scoped end/update — cannot touch another user's session. */
  async end(
    currentUser: User,
    id: string,
    payload: { focus_seconds?: number; idle_seconds?: number; ended_at?: string },
    sessionId: string
  ): Promise<StudySession> {
    const updated = await studyDb.updateOwned(
      id,
      currentUser.id,
      {
        focus_seconds: StudyDomain.clampSeconds(payload.focus_seconds),
        idle_seconds: StudyDomain.clampSeconds(payload.idle_seconds),
        ended_at: payload.ended_at || new Date().toISOString(),
      },
      sessionId
    );
    if (!updated) throw new NotFoundError('Study session not found');
    return updated;
  }

  private resolveTarget(currentUser: User, requestedUserId?: string): string {
    if (!requestedUserId || requestedUserId === currentUser.id) return currentUser.id;
    if (currentUser.role === 'admin' || (currentUser.role === 'teacher' && rbac.can(currentUser, 'user:view'))) {
      return requestedUserId;
    }
    throw new ForbiddenError('Not allowed to view another user\u2019s study data');
  }
}

export const studyService = new StudyService();
