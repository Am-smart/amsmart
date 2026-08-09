import { withSession, supabase } from '../supabase.server';
import { adminClient } from '../supabase-admin.server';
import { StudySession } from '../types';
import { dbUtils } from './db-utils.server';

const S_SELECT = '*, courses(title)';

export const studyDb = {
  async findAll(
    sessionId: string,
    filters: { userId?: string; courseId?: string; since?: string; limit?: number; offset?: number } = {}
  ): Promise<StudySession[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('study_sessions').select(S_SELECT);
    if (sessionId) query = withSession(query, sessionId);
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.courseId) query = query.eq('course_id', filters.courseId);
    if (filters.since) query = query.gte('started_at', filters.since);
    query = query.order('started_at', { ascending: false });
    query = dbUtils.applyPagination(query, filters);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return (data ?? []) as StudySession[];
  },

  async findById(id: string, sessionId?: string): Promise<StudySession | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('study_sessions').select(S_SELECT).eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as StudySession | null;
  },

  async insert(session: Partial<StudySession>, sessionId?: string): Promise<StudySession> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const { courses: _c, ...payload } = session as Record<string, unknown>;
    let query = client.from('study_sessions').insert(payload);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select(S_SELECT).single();
    if (error) dbUtils.handleError(error);
    return data as StudySession;
  },

  /**
   * Ownership-scoped update: `ownerId` is mandatory so a study session can
   * never be mutated across users (IDOR guard mirrors notifications).
   */
  async updateOwned(id: string, ownerId: string, updates: Partial<StudySession>, sessionId?: string): Promise<StudySession | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const { courses: _c, user_id: _uid, ...payload } = updates as Record<string, unknown>;
    let query = client
      .from('study_sessions')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', ownerId);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select(S_SELECT).maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as StudySession | null;
  },
};
