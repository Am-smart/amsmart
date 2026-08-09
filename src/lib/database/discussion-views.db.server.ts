import { withSession, supabase } from '../supabase.server';
import { adminClient } from '../supabase-admin.server';
import { dbUtils } from './db-utils.server';

export interface DiscussionView {
  discussion_id: string;
  user_id: string;
  last_viewed_at: string;
}

export const discussionViewDb = {
  async findByUser(userId: string, sessionId?: string): Promise<DiscussionView[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('discussion_views').select('*').eq('user_id', userId);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return (data ?? []) as DiscussionView[];
  },

  /** Ownership-scoped: the row is always keyed to the acting user. */
  async markViewed(discussionId: string, userId: string, sessionId?: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('discussion_views').upsert(
      { discussion_id: discussionId, user_id: userId, last_viewed_at: new Date().toISOString() },
      { onConflict: 'discussion_id,user_id' }
    );
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },
};
