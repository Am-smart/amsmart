import { withSession, supabase } from '../supabase';
import { adminClient } from '../supabase-admin';
import { User, LiveClass, Notification, Broadcast, Discussion, PlannerItem, Maintenance, Setting, SystemLog, Attendance, SupportTicket, AntiCheatLog, PushSubscription } from '../types';
import { dbUtils } from './db-utils';

export const systemDb = {
  // User Operations
  async findUserById(id: string, sessionId?: string): Promise<User | null> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('users').select('*').eq('id', id).single();
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST116') return null;
      dbUtils.handleError(error);
    }
    return data as User;
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const client = adminClient || supabase;
    const { data, error } = await client.from('users').select('*').eq('email', email).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      dbUtils.handleError(error);
    }
    return data as User;
  },

  async findAllUsers(sessionId: string, options: { limit?: number; offset?: number } = {}): Promise<User[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('users').select('*');
    if (sessionId) query = withSession(query, sessionId);
    query = dbUtils.applyPagination(query, options);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as User[];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const client = adminClient || supabase;
    const { data, error } = await client.from('users').insert(userData).select().single();
    if (error) dbUtils.handleError(error);
    return data as User;
  },

  async updateUser(id: string, updates: Partial<User>, sessionId: string, version?: number): Promise<User> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    // Strip sensitive fields for non-admin update path
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, flagged, active, password, ...safeUpdates } = updates as Record<string, unknown>;

    const upsertData = dbUtils.prepareUpsert({ ...safeUpdates, id, version });
    let query = client.from('users').update(upsertData as Record<string, unknown>).eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    query = dbUtils.applyVersionCheck(query, id, version);

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'User profile', id, version);
    return data as User;
  },

  async adminUpdateUser(id: string, updates: Partial<User>, sessionId: string): Promise<void> {
      const client = (sessionId && adminClient) ? supabase : (adminClient || supabase); // Admin update explicitly uses adminClient if available
      const { hashPassword } = await import('../crypto');

      const userUpdates: Record<string, unknown> = {
          full_name: updates.full_name,
          email: updates.email,
          phone: updates.phone,
          role: updates.role,
          active: updates.active,
          flagged: updates.flagged,
          version: (updates.version || 0) + 1,
          updated_at: new Date().toISOString()
      };

      if (updates.password && updates.password !== '') {
          userUpdates.password = await hashPassword(updates.password);
      }

      // Filter out undefined values to only update provided fields
      Object.keys(userUpdates).forEach(key => {
          if (userUpdates[key] === undefined) delete userUpdates[key];
      });

      let query = client.from('users').update(userUpdates).eq('id', id);
      if (sessionId) query = withSession(query, sessionId);
      const { error } = await query;

      if (error) dbUtils.handleError(error);
  },

  async deleteUser(id: string, sessionId: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('users').delete().eq('id', id);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  // Live Class Operations
  async findLiveClassById(id: string, sessionId: string): Promise<LiveClass | null> {
    const { data, error } = await withSession(supabase.from('live_classes').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as LiveClass;
  },

  async findAllLiveClasses(courseId?: string, teacherId?: string, sessionId?: string, options: { limit?: number; offset?: number } = {}): Promise<LiveClass[]> {
    let query = withSession(supabase.from('live_classes').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    query = dbUtils.applyPagination(query, options);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as LiveClass[];
  },

  async upsertLiveClass(liveClass: Partial<LiveClass>, sessionId: string): Promise<LiveClass> {
    const upsertData = dbUtils.prepareUpsert(liveClass, ['courses', 'course']);
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('live_classes'), sessionId).upsert(upsertData as Record<string, unknown>),
      liveClass.id,
      liveClass.version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'Live class', liveClass.id, liveClass.version);
    return data as LiveClass;
  },

  async deleteLiveClass(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('live_classes'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Attendance Operations
  async upsertAttendance(attendance: { live_class_id: string, student_id: string, join_time: string, is_present: boolean }, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('attendance'), sessionId).upsert(attendance, { onConflict: 'live_class_id,student_id' });
    if (error) dbUtils.handleError(error);
  },

  async findAttendanceByClassId(liveClassId: string, sessionId: string): Promise<Attendance[]> {
    const { data, error } = await withSession(supabase.from('attendance').select('*, users!student_id(id, full_name, email, role)'), sessionId)
      .eq('live_class_id', liveClassId);
    if (error) dbUtils.handleError(error);
    return data as Attendance[];
  },

  // Notification Operations
  async findNotificationsByUserId(userId: string, sessionId: string, options: { limit?: number; offset?: number } = {}): Promise<Notification[]> {
    let query = withSession(supabase.from('notifications'), sessionId)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    query = dbUtils.applyPagination(query, options);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Notification[];
  },

  async getUnreadNotificationCount(userId: string, sessionId: string): Promise<number> {
    const { count, error } = await withSession(
      supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false),
      sessionId
    );
    if (error) dbUtils.handleError(error);
    return count || 0;
  },

  async markNotificationAsRead(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId).update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },

  async updateNotification(id: string, updates: Partial<Notification>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId).update(updates).eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  async updateMultipleNotifications(ids: string[], updates: Partial<Notification>, sessionId: string): Promise<void> {
      const { error } = await withSession(supabase.from('notifications'), sessionId)
        .update(updates)
        .in('id', ids);
      if (error) dbUtils.handleError(error);
  },

  async updateNotificationsForUser(userId: string, updates: Partial<Notification>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId)
      .update(updates)
      .eq('user_id', userId);
    if (error) dbUtils.handleError(error);
  },

  async markAllNotificationsAsRead(userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('notifications'), sessionId)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async createNotification(notification: Partial<Notification>, sessionId?: string): Promise<Notification> {
    let query = supabase.from('notifications').insert(notification).select().single();
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Notification;
  },

  async createNotifications(notifications: Partial<Notification>[], sessionId?: string): Promise<Notification[]> {
    let query = supabase.from('notifications').insert(notifications).select();
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Notification[];
  },

  async findRecentNotifications(userIds: string[], title: string, message: string, since: string): Promise<string[]> {
    const { data } = await supabase.from('notifications')
        .select('user_id')
        .in('user_id', userIds)
        .eq('title', title)
        .eq('message', message)
        .gt('created_at', since);
    return (data || []).map(n => n.user_id);
  },

  async findAllUserIdsByRole(role?: string): Promise<string[]> {
    let query = supabase.from('users').select('id');
    if (role) query = query.eq('role', role);
    const { data } = await query;
    return (data || []).map(u => u.id);
  },

  async findEnrollmentStudentIds(courseId: string): Promise<string[]> {
    const { data } = await supabase.from('enrollments')
        .select('student_id')
        .eq('course_id', courseId);
    return (data || []).map(s => s.student_id);
  },

  // Broadcast Operations (Table-based)
  async createBroadcast(broadcast: Partial<Broadcast>, sessionId: string): Promise<Broadcast> {
    const { data, error } = await withSession(supabase.from('broadcasts'), sessionId).insert([broadcast]).select().single();
    if (error) dbUtils.handleError(error);
    return data as Broadcast;
  },

  async findAllBroadcasts(sessionId: string): Promise<Broadcast[]> {
    const { data, error } = await withSession(supabase.from('broadcasts'), sessionId).select('*').order('created_at', { ascending: false });
    if (error) dbUtils.handleError(error);
    return data as Broadcast[];
  },

  // Discussion Operations
  async findDiscussionsByCourseId(courseId: string, sessionId: string, options: { limit?: number; offset?: number } = {}): Promise<Discussion[]> {
    let query = withSession(supabase.from('discussions'), sessionId)
      .select('*, users!user_id(full_name, email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });
    query = dbUtils.applyPagination(query, options);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Discussion[];
  },

  async upsertDiscussion(post: Partial<Discussion>, sessionId: string): Promise<Discussion> {
    const upsertData = dbUtils.prepareUpsert(post, ['users', 'user']);
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('discussions'), sessionId).upsert(upsertData as Record<string, unknown>),
      post.id,
      post.version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'Discussion post', post.id, post.version);
    return data as Discussion;
  },

  async deleteDiscussion(id: string, userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('discussions'), sessionId).delete().eq('id', id).eq('user_id', userId);
    if (error) dbUtils.handleError(error);
  },

  // Planner Operations
  async findPlannerItemsByUserId(userId: string, sessionId: string, options: { limit?: number; offset?: number } = {}): Promise<PlannerItem[]> {
    let query = withSession(supabase.from('planner'), sessionId).select('*').eq('user_id', userId);
    query = dbUtils.applyPagination(query, options);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as PlannerItem[];
  },

  async upsertPlannerItem(item: Partial<PlannerItem>, sessionId: string): Promise<PlannerItem> {
    const upsertData = dbUtils.prepareUpsert(item);
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('planner'), sessionId).upsert(upsertData as Record<string, unknown>),
      item.id,
      item.version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'Planner item', item.id, item.version);
    return data as PlannerItem;
  },

  async deletePlannerItem(id: string, userId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('planner'), sessionId).delete().eq('id', id).eq('user_id', userId);
    if (error) dbUtils.handleError(error);
  },

  // Maintenance Operations
  async getMaintenance(sessionId?: string): Promise<Maintenance> {
    let query = supabase.from('maintenance').select('*');
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.maybeSingle();
    if (error && error.code !== 'PGRST116') dbUtils.handleError(error);
    return data as Maintenance || { enabled: false, schedules: [] };
  },

  async updateMaintenance(maintenance: Partial<Maintenance>, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('maintenance'), sessionId).update(maintenance).eq('id', maintenance.id);
    if (error) dbUtils.handleError(error);
  },

  // Setting Operations
  async findAllSettings(sessionId: string): Promise<Setting[]> {
    const { data, error } = await withSession(supabase.from('settings'), sessionId).select('*');
    if (error) dbUtils.handleError(error);
    return data as Setting[];
  },

  async updateSetting(key: string, value: unknown, sessionId: string): Promise<void> {
    const { error } = await withSession(
      supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }),
      sessionId
    );
    if (error) dbUtils.handleError(error);
  },

  // System Log Operations
  async createSystemLog(log: SystemLog, sessionId?: string): Promise<boolean> {
    const query = supabase.from('system_logs').insert(log);
    const { error } = sessionId ? await withSession(query, sessionId) : await query;
    if (error) {
      console.error('Failed to create system log:', error);
      return false;
    }
    return true;
  },

  async findAllSystemLogs(
    sessionId: string,
    filters: { user_id?: string; course_id?: string; resource_id?: string; category?: string; course_ids?: string[]; limit?: number; offset?: number } = {}
  ): Promise<SystemLog[]> {
    // Robust manual join to avoid "relationship not found" schema errors
    let query = withSession(supabase.from('system_logs'), sessionId)
      .select('*')
      .order('created_at', { ascending: false });

    query = dbUtils.applyPagination(query, filters);

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);
    if (filters.course_ids && filters.course_ids.length > 0) {
      query = query.in('course_id', filters.course_ids);
    }

    const { data, error } = await query;
    if (error) dbUtils.handleError(error);

    const logs = data as SystemLog[];
    const userIds = [...new Set(logs.map(l => l.user_id).filter(id => !!id))] as string[];

    if (userIds.length > 0) {
      const { data: userData, error: userError } = await withSession(
        supabase.from('users').select('id, full_name, email'),
        sessionId
      ).in('id', userIds);

      if (!userError && userData) {
        const userMap = new Map(userData.map(u => [u.id, u]));
        return logs.map(log => ({
          ...log,
          users: log.user_id ? userMap.get(log.user_id) as { full_name: string; email: string } : undefined
        }));
      }
    }

    return logs;
  },

  async deleteSystemLogs(
    sessionId: string,
    filters: { course_id?: string; resource_id?: string; category?: string; before?: string } = {}
  ): Promise<void> {
    let query = withSession(supabase.from('system_logs'), sessionId).delete();

    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.before) query = query.lte('created_at', filters.before);

    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async updateSystemLog(id: string, updates: Partial<SystemLog>, sessionId: string): Promise<SystemLog> {
    const { data, error } = await withSession(supabase.from('system_logs'), sessionId).update(updates).eq('id', id).select().single();
    if (error) dbUtils.handleError(error);
    return data as SystemLog;
  },

  // Support Ticket Operations
  async findAllSupportTickets(sessionId: string, filters: { user_id?: string; assigned_to?: string; status?: string; limit?: number; offset?: number } = {}): Promise<SupportTicket[]> {
    let query = withSession(supabase.from('support_tickets'), sessionId)
      .select('*, users!user_id(id, full_name, email)');

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters.status) query = query.eq('status', filters.status);

    query = dbUtils.applyPagination(query, filters);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) dbUtils.handleError(error);

    const tickets = data as (SupportTicket & { users?: unknown })[];
    return tickets.map(ticket => ({
      ...ticket,
      users: ticket.users as { full_name: string; email: string }
    }));
  },

  async findSupportTicketById(id: string, sessionId: string): Promise<SupportTicket | null> {
    const { data, error } = await withSession(supabase.from('support_tickets').select('*, users!user_id(id, full_name, email)').eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as SupportTicket;
  },

  async findDiscussionById(id: string, sessionId?: string): Promise<Discussion | null> {
    let query = supabase.from('discussions').select('user_id, title').eq('id', id).single();
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST116') return null;
      dbUtils.handleError(error);
    }
    return data as Discussion;
  },

  async uploadFile(filePath: string, buffer: ArrayBuffer, contentType: string, sessionId: string): Promise<void> {
    const storage = supabase.storage.from('lms-files');
    const storageWithSession = sessionId ? withSession(storage, sessionId) : storage;

    const { error } = await storageWithSession.upload(filePath, buffer, {
        contentType,
        upsert: true
    });

    if (error) throw error;
  },

  getPublicUrl(filePath: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from('lms-files')
      .getPublicUrl(filePath);
    return publicUrl;
  },

  async upsertSupportTicket(ticket: Partial<SupportTicket>, sessionId: string): Promise<SupportTicket> {
    const upsertData = dbUtils.prepareUpsert(ticket, ['users', 'user']);
    const query = dbUtils.applyVersionCheck(
      withSession(supabase.from('support_tickets'), sessionId).upsert(upsertData as Record<string, unknown>),
      ticket.id,
      ticket.version
    );

    const { data, error } = await query.select().single();
    if (error) dbUtils.handleUpsertError(error, 'Support ticket', ticket.id, ticket.version);
    return data as SupportTicket;
  },

  async deleteSupportTicket(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('support_tickets'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Anti-Cheat Operations
  async createAntiCheatLog(log: AntiCheatLog, sessionId?: string): Promise<void> {
    const query = supabase.from('anti_cheat_logs').insert(log);
    const { error } = sessionId ? await withSession(query, sessionId) : await query;
    if (error) dbUtils.handleError(error);
  },

  async findAllAntiCheatLogs(
    sessionId: string,
    filters: { user_id?: string; course_id?: string; resource_id?: string; limit?: number; offset?: number } = {}
  ): Promise<AntiCheatLog[]> {
    let query = withSession(supabase.from('anti_cheat_logs'), sessionId)
      .select('*, users!user_id(id, full_name, email), courses!course_id(*)')
      .order('created_at', { ascending: false });

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.course_id) query = query.eq('course_id', filters.course_id);
    if (filters.resource_id) query = query.eq('resource_id', filters.resource_id);

    query = dbUtils.applyPagination(query, filters);

    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as AntiCheatLog[];
  },

  async getSystemStats(sessionId?: string): Promise<Record<string, number>> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let usersQuery = client.from('users').select('*', { count: 'exact', head: true });
    let coursesQuery = client.from('courses').select('*', { count: 'exact', head: true });
    let enrollmentsQuery = client.from('enrollments').select('*', { count: 'exact', head: true });
    let submissionsQuery = client.from('submissions').select('*', { count: 'exact', head: true });

    if (sessionId) {
        usersQuery = withSession(usersQuery, sessionId);
        coursesQuery = withSession(coursesQuery, sessionId);
        enrollmentsQuery = withSession(enrollmentsQuery, sessionId);
        submissionsQuery = withSession(submissionsQuery, sessionId);
    }

    const [users, courses, enrollments, submissions] = await Promise.all([
        usersQuery,
        coursesQuery,
        enrollmentsQuery,
        submissionsQuery
    ]);

    return {
        users: users.count || 0,
        courses: courses.count || 0,
        enrollments: enrollments.count || 0,
        submissions: submissions.count || 0
    };
  },

  async getHealthMetrics(sessionId?: string): Promise<unknown> {
    // Basic health check for multiple systems
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const startTime = Date.now();
    let dbStatus = 'healthy';
    try {
        let query = client.from('settings').select('count', { count: 'exact', head: true });
        if (sessionId) query = withSession(query, sessionId);
        const { error } = await query;
        if (error) dbStatus = 'degraded';
    } catch {
        dbStatus = 'unhealthy';
    }

    return {
        status: dbStatus === 'healthy' ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
        services: {
            database: dbStatus,
            auth: 'healthy', // Simplified
            storage: 'healthy' // Simplified
        }
    };
  },

  async countUsersByRole(role?: string): Promise<number> {
      const client = adminClient || supabase;
      let query = client.from('users').select('*', { count: 'exact', head: true });
      if (role) {
          query = query.eq('role', role);
      }
      const { count, error } = await query;
      if (error) dbUtils.handleError(error);
      return count || 0;
  },

  async cleanupExpiredNotifications(now: string, sessionId: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('notifications').delete().lt('expires_at', now);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async cleanupExpiredSessions(now: string, sessionId: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('sessions').delete().lt('expires_at', now);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async cleanupExpiredBroadcasts(now: string, sessionId: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('broadcasts').delete().lt('expires_at', now);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  // Push Subscription Operations
  async findPushSubscriptionsByUserId(userId: string, sessionId?: string): Promise<PushSubscription[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('push_subscriptions').select('*').eq('user_id', userId);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as PushSubscription[];
  },

  async findPushSubscriptionsByUserIds(userIds: string[], sessionId?: string): Promise<PushSubscription[]> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('push_subscriptions').select('*').in('user_id', userIds);
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as PushSubscription[];
  },

  async upsertPushSubscription(subscription: Partial<PushSubscription>, sessionId: string): Promise<PushSubscription> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    const upsertData = {
        ...subscription,
        updated_at: new Date().toISOString()
    };
    let query = client.from('push_subscriptions').upsert(upsertData, { onConflict: 'endpoint' });
    if (sessionId) query = withSession(query, sessionId);
    const { data, error } = await query.select().single();
    if (error) dbUtils.handleError(error);
    return data as PushSubscription;
  },

  async deletePushSubscription(endpoint: string, sessionId: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  },

  async cleanupStalePushSubscriptions(before: string, sessionId: string): Promise<void> {
    const client = (sessionId && adminClient) ? supabase : (adminClient || supabase);
    let query = client.from('push_subscriptions').delete().lt('updated_at', before);
    if (sessionId) query = withSession(query, sessionId);
    const { error } = await query;
    if (error) dbUtils.handleError(error);
  }
};
