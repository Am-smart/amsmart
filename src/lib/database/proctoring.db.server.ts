import { withSession, supabase } from '../supabase.server';
import { adminClient } from '../supabase-admin.server';
import { Violation, ProctoredSessionDTO } from '../types';
import { dbUtils } from './db-utils.server';

const V_SELECT = '*, users!user_id(full_name, email)';

export const proctoringDb = {
  async insertMany(violations: Partial<Violation>[], sessionId?: string): Promise<number> {
    if (!violations.length) return 0;
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const rows = violations.map((v) => {
      const { users: _u, ...rest } = v as Record<string, unknown>;
      return rest;
    });
    let query = client.from('violations').insert(rows);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
    return rows.length;
  },

  async findAll(
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
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('violations').select(V_SELECT);
    if (sessionId) query = withSession(query, sessionId);
    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.assessmentId) query = query.eq('assessment_id', filters.assessmentId);
    if (filters.proctorSessionId) query = query.eq('session_id', filters.proctorSessionId);
    if (filters.severity) query = query.eq('severity', filters.severity);
    if (filters.since) query = query.gte('timestamp', filters.since);
    query = query.order('timestamp', { ascending: false });
    query = dbUtils.applyPagination(query, filters);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return (data ?? []) as Violation[];
  },

  /** Live monitor rollup — backed by the `get_active_proctored_sessions` RPC. */
  async findActiveSessions(sessionId?: string): Promise<ProctoredSessionDTO[]> {
    const client = adminClient || supabase;
    let rpc = client.rpc('get_active_proctored_sessions');
    if (sessionId) rpc = withSession(rpc, sessionId);
    const { data, error } = await rpc;
    if (error) dbUtils.handleError(error);
    return (data ?? []) as ProctoredSessionDTO[];
  },
};
