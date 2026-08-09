import { withSession, supabase } from '../supabase.server';
import { adminClient } from '../supabase-admin.server';
import { Certificate } from '../types';
import { dbUtils } from './db-utils.server';

const CERT_SELECT = '*, users!user_id(full_name, email), courses(title)';

export const certificateDb = {
  async findAll(
    sessionId: string,
    filters: { userId?: string; courseId?: string; teacherId?: string; limit?: number; offset?: number } = {}
  ): Promise<Certificate[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('certificates').select(
      filters.teacherId ? '*, users!user_id(full_name, email), courses!inner(title, teacher_id)' : CERT_SELECT
    );
    if (sessionId) query = withSession(query, sessionId);
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.courseId) query = query.eq('course_id', filters.courseId);
    if (filters.teacherId) query = query.eq('courses.teacher_id', filters.teacherId);
    query = query.order('issued_at', { ascending: false });
    query = dbUtils.applyPagination(query, filters);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return (data ?? []) as Certificate[];
  },

  async findById(id: string, sessionId?: string): Promise<Certificate | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('certificates').select(CERT_SELECT).eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as Certificate | null;
  },

  /**
   * Public verification lookup by code. Deliberately uses the admin client
   * (no session) but callers MUST project only non-sensitive fields.
   */
  async findByCode(code: string): Promise<Certificate | null> {
    const client = adminClient || supabase;
    const { data, error } = await client
      .from('certificates')
      .select('id, code, course_title, recipient_name, title, template, issued_at, revoked_at')
      .eq('code', code)
      .maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as Certificate | null;
  },

  async findByUserAndCourse(userId: string, courseId: string, sessionId?: string): Promise<Certificate | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('certificates').select(CERT_SELECT).eq('user_id', userId).eq('course_id', courseId);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as Certificate | null;
  },

  async insert(certificate: Partial<Certificate>, sessionId?: string): Promise<Certificate> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const { users: _u, courses: _c, ...payload } = certificate as Record<string, unknown>;
    let query = client.from('certificates').insert(payload);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select(CERT_SELECT).single();
    if (error) dbUtils.handleError(error);
    return data as Certificate;
  },

  async update(id: string, updates: Partial<Certificate>, sessionId?: string): Promise<Certificate> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const { users: _u, courses: _c, ...payload } = updates as Record<string, unknown>;
    let query = client.from('certificates').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select(CERT_SELECT).single();
    if (error) dbUtils.handleError(error);
    return data as Certificate;
  },

  async remove(id: string, sessionId?: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('certificates').delete().eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },
};
