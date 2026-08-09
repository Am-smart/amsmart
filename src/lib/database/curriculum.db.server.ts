import { withSession, supabase } from '../supabase.server';
import { adminClient } from '../supabase-admin.server';
import { Topic } from '../types';
import { dbUtils } from './db-utils.server';

export const curriculumDb = {
  async findTopicsByCourse(courseId: string, sessionId?: string): Promise<Topic[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('topics').select('*').eq('course_id', courseId).order('order_index', { ascending: true });
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return (data ?? []) as Topic[];
  },

  async findTopicById(id: string, sessionId?: string): Promise<Topic | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('topics').select('*').eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    return (data ?? null) as Topic | null;
  },

  async upsertTopic(topic: Partial<Topic>, sessionId?: string): Promise<Topic> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const payload = { ...topic, updated_at: new Date().toISOString() };
    let query = client.from('topics').upsert(payload);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select('*').single();
    if (error) dbUtils.handleError(error);
    return data as Topic;
  },

  async deleteTopic(id: string, sessionId?: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('topics').delete().eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },
};
