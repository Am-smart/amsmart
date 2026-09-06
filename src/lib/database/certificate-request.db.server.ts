import { withSession, supabase } from '../supabase.server';
import { adminClient } from '../supabase-admin.server';
import { CertificateRequest, CertificateTemplate } from '../types';
import { dbUtils, SAFE_USER_SELECT } from './db-utils.server';

const REQ_SELECT = `*, users!user_id(${SAFE_USER_SELECT}), courses(title, teacher_id)`;
const TEMPLATES_KEY = 'certificate_templates';

export const certificateRequestDb = {
  async findAll(
    sessionId: string,
    filters: {
      userId?: string;
      courseId?: string;
      teacherId?: string;
      status?: string | string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<CertificateRequest[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('certificate_requests').select(
      filters.teacherId
        ? `*, users!user_id(${SAFE_USER_SELECT}), courses!inner(title, teacher_id)`
        : REQ_SELECT
    );
    if (sessionId) query = withSession(query, sessionId);
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.courseId) query = query.eq('course_id', filters.courseId);
    if (filters.teacherId) query = query.eq('courses.teacher_id', filters.teacherId);
    if (Array.isArray(filters.status)) query = query.in('status', filters.status);
    else if (filters.status) query = query.eq('status', filters.status);
    query = query.order('created_at', { ascending: false }).order('id', { ascending: true });
    query = dbUtils.applyPagination(query, filters);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return (data ?? []) as CertificateRequest[];
  },

  async findById(id: string, sessionId?: string): Promise<CertificateRequest | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('certificate_requests').select(REQ_SELECT).eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as CertificateRequest | null;
  },

  async findByUserAndCourse(
    userId: string,
    courseId: string,
    sessionId?: string
  ): Promise<CertificateRequest | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client
      .from('certificate_requests')
      .select(REQ_SELECT)
      .eq('user_id', userId)
      .eq('course_id', courseId);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as CertificateRequest | null;
  },

  async insert(request: Partial<CertificateRequest>, sessionId?: string): Promise<CertificateRequest> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const { users: _u, courses: _c, ...payload } = request as Record<string, unknown>;
    let query = client.from('certificate_requests').insert(payload);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select(REQ_SELECT).single();
    if (error) dbUtils.handleError(error);
    return data as CertificateRequest;
  },

  async update(
    id: string,
    updates: Partial<CertificateRequest>,
    sessionId?: string
  ): Promise<CertificateRequest> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const { users: _u, courses: _c, ...payload } = updates as Record<string, unknown>;
    let query = client
      .from('certificate_requests')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select(REQ_SELECT).single();
    if (error) dbUtils.handleError(error);
    return data as CertificateRequest;
  },

  /** Admin-managed certificate templates live in the shared `settings` table. */
  async getTemplates(sessionId?: string): Promise<CertificateTemplate[] | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('settings').select('value').eq('key', TEMPLATES_KEY);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    const value = (data as { value?: unknown } | null)?.value;
    return Array.isArray(value) ? (value as CertificateTemplate[]) : null;
  },

  async saveTemplates(templates: CertificateTemplate[], sessionId?: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client
      .from('settings')
      .upsert({ key: TEMPLATES_KEY, value: templates, updated_at: new Date().toISOString() });
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },
};
