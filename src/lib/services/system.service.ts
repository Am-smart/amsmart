import { systemDb } from '../database/system.db';
import { learningDb } from '../database/learning.db';
import { SystemLog, Maintenance, PlannerItem, User, Setting, Enrollment, Discussion, Notification, LiveClass, Broadcast, Attendance, SupportTicket, AntiCheatLog } from '../types';
import { UserDomain } from '../domain/user.domain';
import { EnrollmentDomain } from '../domain/enrollment.domain';
import { CommunicationDomain } from '../domain/communication.domain';
import { NotFoundError, UnauthorizedError, ForbiddenError, BadRequestError } from '../api-error';

export class SystemService {
  // Logs
  async createLog(log: SystemLog, sessionId?: string): Promise<boolean> {
    return systemDb.createSystemLog(log, sessionId);
  }

  async createLogAsync(log: SystemLog): Promise<void> {
    const { taskQueue } = await import('../queue/task-queue');
    taskQueue.enqueue(async () => {
        const { serviceRegistry } = await import('./service-registry');
        await serviceRegistry.systemService.createLog(log);
    });
  }

  // Anti-Cheat Logs
  async createAntiCheatLog(log: AntiCheatLog, sessionId?: string): Promise<void> {
    // Distributed-safe rate limiting via database check
    const recentUserLogs = await systemDb.findAllAntiCheatLogs(sessionId || '', {
        user_id: log.user_id,
        limit: 1
    });

    if (recentUserLogs.length > 0) {
        const lastLog = recentUserLogs[0];
        if (lastLog.created_at) {
            const lastTime = new Date(lastLog.created_at).getTime();
            if (Date.now() - lastTime < 1000) {
                console.warn(`[Anti-Cheat] Rate limit exceeded for user ${log.user_id} (distributed)`);
                return;
            }
        }
    }

    await systemDb.createAntiCheatLog(log, sessionId);

    // Automated Violation Threshold Response
    const { ANTI_CHEAT } = await import('../constants');
    const recentLogs = await systemDb.findAllAntiCheatLogs(sessionId || '', {
        user_id: log.user_id,
        course_id: log.course_id,
        limit: ANTI_CHEAT.MAX_VIOLATIONS
    });

    if (recentLogs.length >= ANTI_CHEAT.MAX_VIOLATIONS) {
        // Threshold exceeded - flag user and notify admin
        const user = await systemDb.findUserById(log.user_id, sessionId);
        if (user && !user.flagged) {
            await systemDb.updateUser(user.id, { flagged: true, version: user.version }, sessionId || '');
            await systemService.createLogAsync({
                level: 'warn',
                category: 'security',
                message: `User ${user.full_name} automatically flagged due to excessive anti-cheat violations (${recentLogs.length}).`,
                user_id: user.id,
                course_id: log.course_id,
                metadata: { violations: recentLogs.length, last_type: log.type }
            });

            // Notify Admins
            const admins = await systemDb.findAllUserIdsByRole('admin');
            if (admins && admins.length > 0) {
                const { serviceRegistry } = await import('./service-registry');
                await serviceRegistry.systemService.notifyUsers({
                    target_ids: admins,
                    n_title: 'Security Alert: User Flagged',
                    n_msg: `Student ${user.full_name} has been flagged for ${recentLogs.length} anti-cheat violations in course.`,
                    n_type: 'security',
                    metadata: { student_id: user.id, course_id: log.course_id }
                }, sessionId || '');
            }
        }
    }
  }

  async getAntiCheatLogs(
    currentUser: User,
    sessionId: string,
    filters: { user_id?: string; course_id?: string; resource_id?: string; limit?: number } = {}
  ): Promise<AntiCheatLog[]> {
    if (!currentUser) throw new UnauthorizedError();

    const finalFilters = { ...filters };

    if (UserDomain.isAdmin(currentUser)) {
      // Admins see all
    } else if (UserDomain.isTeacher(currentUser)) {
      // RLS handles teacher viewing logs for their own courses
    } else {
      // Students see only their own
      finalFilters.user_id = currentUser.id;
    }

    return systemDb.findAllAntiCheatLogs(sessionId, finalFilters);
  }

  async getLogs(
    currentUser: User,
    sessionId: string,
    filters: { user_id?: string; course_id?: string; resource_id?: string; category?: string; course_ids?: string[]; limit?: number; offset?: number } = {}
  ): Promise<SystemLog[]> {
    if (!currentUser) throw new UnauthorizedError();

    const finalFilters: { user_id?: string; course_id?: string; resource_id?: string; category?: string; course_ids?: string[]; limit?: number; offset?: number } = { ...filters };

    // Role-based filtering logic
    if (UserDomain.isAdmin(currentUser)) {
      // Admins have full access, keep filters as is
    } else if (UserDomain.isTeacher(currentUser)) {
      // Teachers can only see anti-cheat logs for their courses
      finalFilters.category = 'anti-cheat';

      const teacherCourses = await learningDb.findAllCourses(currentUser.id, sessionId);
      const teacherCourseIds = teacherCourses.map(c => c.id);

      if (finalFilters.course_id) {
        if (!teacherCourseIds.includes(finalFilters.course_id)) {
          throw new ForbiddenError('Forbidden: You can only view logs for your own courses');
        }
      } else {
        // If no course_id is specified, the systemDb will need to handle multiple course_ids
        // Since findAllSystemLogs currently takes a single course_id, we'll implement
        // a fallback or update the adapter. For now, let's enforce providing a course_id
        // or ensure the teacher only sees logs they are authorized for.
        // We will pass all teacher course IDs to the adapter if it supports arrays.
        finalFilters.course_ids = teacherCourseIds;
      }
    } else {
      // Students can only see their own anti-cheat logs
      finalFilters.category = 'anti-cheat';
      finalFilters.user_id = currentUser.id;

      // Verify student is actually enrolled in the course if course_id is provided
      if (finalFilters.course_id) {
          const enrollment = await learningDb.findEnrollmentByCourseAndStudent(finalFilters.course_id, currentUser.id, sessionId);
          if (!enrollment) {
              throw new ForbiddenError('Forbidden: You are not enrolled in this course');
          }
      }
    }

    return systemDb.findAllSystemLogs(sessionId, finalFilters);
  }

  async clearLogs(
    currentUser: User,
    sessionId: string,
    filters: { course_id?: string; resource_id?: string; category?: string; before?: string } = {}
  ): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    await systemDb.deleteSystemLogs(sessionId, filters);
  }

  async updateLog(currentUser: User, id: string, updates: Partial<SystemLog>, sessionId: string): Promise<SystemLog> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    return systemDb.updateSystemLog(id, updates, sessionId);
  }

  // Maintenance
  async getMaintenance(sessionId?: string): Promise<Maintenance> {
    return systemDb.getMaintenance(sessionId);
  }

  async updateMaintenance(currentUser: User, maintenance: Partial<Maintenance>, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    await systemDb.updateMaintenance(maintenance, sessionId);
  }

  // Planner
  async getPlannerItems(userId: string, sessionId: string, currentUser?: User, options: { limit?: number; offset?: number } = {}): Promise<PlannerItem[]> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only view your own planner items');
    }
    return systemDb.findPlannerItemsByUserId(userId, sessionId, options);
  }

  async savePlannerItem(userId: string, item: Partial<PlannerItem>, sessionId: string, currentUser?: User): Promise<PlannerItem> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only manage your own planner items');
    }
    return systemDb.upsertPlannerItem({ ...item, user_id: userId }, sessionId);
  }

  async deletePlannerItem(userId: string, id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only manage your own planner items');
    }
    await systemDb.deletePlannerItem(id, userId, sessionId);
  }

  // Settings
  async getSettings(currentUser: User, sessionId: string): Promise<Setting[]> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    return systemDb.findAllSettings(sessionId);
  }

  async updateSetting(currentUser: User, key: string, value: unknown, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    await systemDb.updateSetting(key, value, sessionId);
  }

  // Enrollments (Merged from EnrollmentService)
  async isEnrolled(courseId: string, studentId: string, sessionId: string): Promise<boolean> {
    const enrollment = await learningDb.findEnrollmentByCourseAndStudent(courseId, studentId, sessionId);
    return !!enrollment;
  }

  async enrollInCourse(studentId: string, courseId: string, sessionId: string, enrollmentCode?: string): Promise<Enrollment> {
    const course = await learningDb.findCourseById(courseId, sessionId);
    if (!course) throw new NotFoundError('Course not found');

    // Prevent duplicate enrollment
    const existing = await learningDb.findEnrollmentByCourseAndStudent(courseId, studentId, sessionId);
    if (existing) {
        throw new Error('You are already enrolled in this course');
    }

    // Enrollment code validation
    if (course.enrollment_id && course.enrollment_id.trim() !== '') {
        if (!enrollmentCode || enrollmentCode.trim() !== course.enrollment_id.trim()) {
            throw new ForbiddenError('Invalid enrollment code');
        }
    }

    // Max enrollment limit enforcement
    if (course.max_enrollment && course.max_enrollment > 0) {
        const currentCount = await learningDb.countEnrollmentsByCourseId(courseId, sessionId);
        if (currentCount >= course.max_enrollment) {
            throw new ForbiddenError('Course has reached its maximum enrollment capacity');
        }
    }

    const enrollmentToSave = EnrollmentDomain.create(studentId, courseId);
    return learningDb.upsertEnrollment(enrollmentToSave, sessionId);
  }

  async getStudentEnrollments(studentId: string, sessionId: string, currentUser?: User): Promise<Enrollment[]> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== studentId) {
        throw new ForbiddenError('Unauthorized: You can only view your own enrollments');
    }
    return learningDb.findEnrollmentsByStudentId(studentId, sessionId);
  }

  async getCourseEnrollments(currentUser: User, courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    if (!UserDomain.canManageContent(currentUser)) throw new ForbiddenError();

    if (UserDomain.isTeacher(currentUser)) {
        const teacherCourses = await learningDb.findAllCourses(currentUser.id, sessionId);
        const teacherCourseIds = teacherCourses.map(c => c.id);
        if (!courseIds.every(id => teacherCourseIds.includes(id))) {
            throw new ForbiddenError('Forbidden: You can only view enrollments for your own courses');
        }
    }

    return learningDb.findEnrollmentsByCourseIds(courseIds, sessionId);
  }

  async removeEnrollment(currentUser: User, courseId: string, studentId: string, sessionId: string): Promise<void> {
    if (!UserDomain.canManageContent(currentUser)) throw new ForbiddenError();
    await learningDb.deleteEnrollment(courseId, studentId, sessionId);
  }

  // Communications (Merged from CommunicationService)
  async getDiscussions(courseId: string, sessionId: string, userId?: string, userRole?: string, options: { limit?: number; offset?: number } = {}): Promise<Discussion[]> {
    if (userRole === 'student' && userId) {
        const enrollment = await learningDb.findEnrollmentByCourseAndStudent(courseId, userId, sessionId!);
        if (!enrollment) return [];
    }
    return systemDb.findDiscussionsByCourseId(courseId, sessionId, options);
  }

  async saveDiscussionPost(currentUser: User, post: Partial<Discussion>, sessionId: string): Promise<Discussion> {
    const postToSave = CommunicationDomain.prepareDiscussion(post, currentUser.id);
    const saved = await systemDb.upsertDiscussion(postToSave, sessionId);

    // Notify parent post author if it's a reply
    if (saved.parent_id) {
        const { taskQueue } = await import('../queue/task-queue');
        taskQueue.enqueue(async () => {
            const parent = await systemDb.findDiscussionById(saved.parent_id!, sessionId);
            if (parent && parent.user_id !== currentUser.id) {
                const { serviceRegistry } = await import('./service-registry');
                await serviceRegistry.systemService.notifyUser({
                    target_id: parent.user_id,
                    n_title: 'New Reply on Discussion',
                    n_msg: `${currentUser.full_name} replied to your post "${parent.title || 'Untitled'}"`,
                    n_link: `course:${saved.course_id}`, // Deep link to course discussion
                    n_type: 'discussion'
                }, sessionId);
            }
        });
    }

    return saved;
  }

  async deleteDiscussionPost(currentUser: User, id: string, sessionId: string): Promise<void> {
    await systemDb.deleteDiscussion(id, currentUser.id, sessionId);
  }

  async getNotifications(userId: string, sessionId: string, currentUser?: User, options: { limit?: number; offset?: number } = {}): Promise<Notification[]> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only view your own notifications');
    }
    return systemDb.findNotificationsByUserId(userId, sessionId, options);
  }

  async getUnreadCount(userId: string, sessionId: string, currentUser?: User): Promise<number> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only access your own notifications');
    }
    return systemDb.getUnreadNotificationCount(userId, sessionId);
  }

  async markNotificationAsRead(id: string, sessionId: string): Promise<void> {
    // Note: The systemDb operation uses sessionId for RLS if configured,
    // but we might want to check ownership if possible here too.
    // For now, RLS handles individual record access.
    await systemDb.markNotificationAsRead(id, sessionId);
  }

  async markAllNotificationsAsRead(userId: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only manage your own notifications');
    }
    // "Clear All" should dismiss all notifications for the user
    await systemDb.updateNotificationsForUser(userId, { dismissed_at: new Date().toISOString(), is_read: true }, sessionId);
  }

  async dismissNotification(id: string, sessionId: string): Promise<void> {
      await systemDb.updateNotification(id, { dismissed_at: new Date().toISOString() }, sessionId);
  }

  async acknowledgeNotification(id: string, sessionId: string): Promise<void> {
      await systemDb.updateNotification(id, { acknowledged_at: new Date().toISOString(), is_read: true }, sessionId);
  }

  async markNotificationAsViewed(id: string, sessionId: string): Promise<void> {
      await systemDb.updateNotification(id, { viewed_at: new Date().toISOString() }, sessionId);
  }

  async markNotificationsAsViewed(ids: string[], sessionId: string): Promise<void> {
      // For bulk update, we can use a custom psql function or loop if the adapter doesn't support bulk.
      // Since systemDb.updateNotification is per-id, let's add a bulk helper to systemDb.
      await systemDb.updateMultipleNotifications(ids, { viewed_at: new Date().toISOString() }, sessionId);
  }

  async notifyUser(params: { target_id: string, n_title: string, n_msg: string, n_link?: string, n_type?: string, expires_at?: string, metadata?: Record<string, string | number | boolean> }, sessionId: string): Promise<void> {
    await this.notifyUsers({
        target_ids: [params.target_id],
        n_title: params.n_title,
        n_msg: params.n_msg,
        n_link: params.n_link,
        n_type: params.n_type,
        expires_at: params.expires_at,
        metadata: params.metadata
    }, sessionId);
  }

  async notifyUsers(params: { target_ids: string[], n_title: string, n_msg: string, n_link?: string, n_type?: string, expires_at?: string, metadata?: Record<string, string | number | boolean> }, sessionId: string): Promise<void> {
    if (params.target_ids.length === 0) return;

    // Use task queue for bulk processing to avoid blocking main thread
    const { taskQueue } = await import('../queue/task-queue');
    taskQueue.enqueue(async () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // 1. Check for duplicates in bulk to prevent notification spam
        const duplicateUserIdsList = await systemDb.findRecentNotifications(params.target_ids, params.n_title, params.n_msg, fiveMinutesAgo);
        const duplicateUserIds = new Set(duplicateUserIdsList);
        const uniqueTargetIds = params.target_ids.filter(id => !duplicateUserIds.has(id));

        if (uniqueTargetIds.length === 0) return;

        // 2. Batch insert notifications in chunks to avoid large payload limits
        const chunkSize = 500;
        const insertedNotifications: Notification[] = [];

        for (let i = 0; i < uniqueTargetIds.length; i += chunkSize) {
            const chunk = uniqueTargetIds.slice(i, i + chunkSize);
            const notificationsToInsert = chunk.map(userId => ({
                user_id: userId,
                title: params.n_title,
                message: params.n_msg,
                link: params.n_link,
                type: params.n_type || 'system',
                expires_at: params.expires_at,
                metadata: params.metadata || {}
            }));

            const data = await systemDb.createNotifications(notificationsToInsert, sessionId);
            if (data) insertedNotifications.push(...data);
        }

        // 3. Batch send push notifications
        const { serviceRegistry } = await import('./service-registry');
        const subscriptions = await systemDb.findPushSubscriptionsByUserIds(uniqueTargetIds, sessionId);

        if (subscriptions.length > 0) {
            // Group subscriptions by user for tagging with specific notification IDs if needed,
            // but for bulk we can use a common tag if appropriate or individual sends.
            // To maintain the "one tag per notification" logic for deduplication:
            const notificationMap = new Map((insertedNotifications || []).map(n => [n.user_id, n.id]));

            const pushTasks = subscriptions.map(async (sub) => {
                const notificationId = notificationMap.get(sub.user_id);
                const res = await serviceRegistry.pushService.sendToMany([sub], {
                    title: params.n_title,
                    body: params.n_msg,
                    tag: notificationId || params.n_title,
                    data: { url: params.n_link || '/' }
                });

                if (res[0] && !res[0].success && res[0].expired) {
                    await systemDb.deletePushSubscription(sub.endpoint, sessionId);
                }
            });

            await Promise.all(pushTasks);
        }
    });
  }

  async getMergedNotifications(user: User, userId: string, sessionId: string, options: { limit?: number; offset?: number } = {}): Promise<Notification[]> {
    // With fan-out trigger, all broadcasts now exist as individual notifications.
    // We only need to fetch from the notifications table.
    // We filter out dismissed and expired notifications.
    const notifications = await this.getNotifications(userId, sessionId, user, options);
    const now = new Date();

    return notifications.filter(n => {
        if (n.dismissed_at) return false;

        // Check for expiration in direct column
        if (n.expires_at) {
            if (new Date(n.expires_at) < now) return false;
        } else if (n.metadata?.expires_at) {
            // Fallback for older notifications in metadata
            try {
                const expiresAt = new Date(n.metadata.expires_at as string);
                if (expiresAt < now) return false;
            } catch {
                // If invalid date, keep the notification
            }
        }

        return true;
    }).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async getLiveClasses(courseId?: string, teacherId?: string, sessionId?: string, userId?: string, userRole?: string, options: { limit?: number; offset?: number } = {}): Promise<LiveClass[]> {
    if (userRole === 'student' && userId) {
        const enrollments = await learningDb.findEnrollmentsByStudentId(userId, sessionId!);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const liveClasses = await systemDb.findAllLiveClasses(courseId, teacherId, sessionId, options);
        return liveClasses.filter(lc => enrolledCourseIds.includes(lc.course_id));
    }

    if (userRole === 'teacher' && userId) {
        const liveClasses = await systemDb.findAllLiveClasses(courseId, userId, sessionId, options);
        return liveClasses;
    }

    return systemDb.findAllLiveClasses(courseId, teacherId, sessionId, options);
  }

  async saveLiveClass(currentUser: User, liveClass: Partial<LiveClass>, sessionId: string): Promise<LiveClass> {
    if (!UserDomain.canManageContent(currentUser)) throw new ForbiddenError();

    let existing: LiveClass | null = null;
    if (UserDomain.isTeacher(currentUser)) {
        if (liveClass.id) {
            existing = await systemDb.findLiveClassById(liveClass.id, sessionId);
            if (existing && existing.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage your own live classes');
            }
        } else if (liveClass.course_id) {
            const course = await learningDb.findCourseById(liveClass.course_id, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only create live classes for your own courses');
            }
        }
    } else if (liveClass.id) {
        existing = await systemDb.findLiveClassById(liveClass.id, sessionId);
    }

    const liveClassToSave = CommunicationDomain.prepareLiveClass(liveClass, currentUser.id);
    const saved = await systemDb.upsertLiveClass(liveClassToSave, sessionId);

    // Trigger Notifications (Migrated from tr_notify_live_class)
    if (saved.status === 'live' && (!existing || existing.status !== 'live')) {
        await this.createBroadcast({
            course_id: saved.course_id,
            target_role: 'student',
            title: 'Live Class Started',
            message: `The class "${saved.title}" has started! Join now.`,
            link: `live-list:${saved.id}`,
            type: 'live_class',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, sessionId);
    } else if (saved.status === 'scheduled' && !existing) {
        await this.createBroadcast({
            course_id: saved.course_id,
            target_role: 'student',
            title: 'Live Class Scheduled',
            message: `A new live class "${saved.title}" has been scheduled for ${saved.start_at}`,
            link: `live-list:${saved.id}`,
            type: 'live_class',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, sessionId);
    } else if (saved.status === 'completed' && existing && existing.status === 'live') {
        await this.createBroadcast({
            course_id: saved.course_id,
            target_role: 'student',
            title: 'Class Ended',
            message: `The live class "${saved.title}" has ended.`,
            link: `live-list:${saved.id}`,
            type: 'class_ended',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, sessionId);
    }

    return saved;
  }

  async deleteLiveClass(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && UserDomain.isTeacher(currentUser)) {
        const existing = await systemDb.findLiveClassById(id, sessionId);
        if (existing && existing.teacher_id !== currentUser.id) {
            throw new ForbiddenError('Unauthorized: You can only manage your own live classes');
        }
    }
    await systemDb.deleteLiveClass(id, sessionId);
  }

  async recordAttendance(studentId: string, liveClassId: string, sessionId: string): Promise<void> {
    await systemDb.upsertAttendance({
      live_class_id: liveClassId,
      student_id: studentId,
      join_time: new Date().toISOString(),
      is_present: true
    }, sessionId);
  }

  async getAttendance(currentUser: User, liveClassId: string, sessionId: string): Promise<Attendance[]> {
      const liveClass = await systemDb.findLiveClassById(liveClassId, sessionId);
      if (!liveClass) throw new NotFoundError('Live class not found');

      if (UserDomain.isTeacher(currentUser) && liveClass.teacher_id !== currentUser.id) {
          throw new ForbiddenError('Unauthorized: You can only view attendance for your own live classes');
      }

      if (UserDomain.isStudent(currentUser)) {
          throw new ForbiddenError('Students are not authorized to view full attendance lists');
      }

      return systemDb.findAttendanceByClassId(liveClassId, sessionId);
  }

  // Support Tickets
  async getSupportTickets(currentUser: User, sessionId: string, filters: { user_id?: string; assigned_to?: string; status?: string; limit?: number; offset?: number } = {}): Promise<SupportTicket[]> {
    if (!currentUser) throw new UnauthorizedError();

    const finalFilters = { ...filters };
    if (UserDomain.isStudent(currentUser)) {
      finalFilters.user_id = currentUser.id;
    } else if (UserDomain.isTeacher(currentUser)) {
      // Teachers can see their own tickets or tickets assigned to them
      if (!finalFilters.user_id && !finalFilters.assigned_to) {
        // By default, systemDb.findAllSupportTickets will use RLS to filter what the teacher can see
        // (owner or assigned_to), so we don't need to force a filter here.
      }
    }

    return systemDb.findAllSupportTickets(sessionId, finalFilters);
  }

  async saveSupportTicket(currentUser: User, ticket: Partial<SupportTicket>, sessionId: string): Promise<SupportTicket> {
    if (!currentUser) throw new UnauthorizedError();

    let existing: SupportTicket | null = null;
    if (ticket.id) {
      existing = await systemDb.findSupportTicketById(ticket.id, sessionId);
      if (!existing) throw new NotFoundError('Ticket not found');

      // Authorization: Owner or Admin or Assigned
      if (existing.user_id !== currentUser.id && !UserDomain.isAdmin(currentUser) && existing.assigned_to !== currentUser.id) {
        throw new ForbiddenError('Unauthorized to update this ticket');
      }
    } else {
      ticket.user_id = currentUser.id;
      ticket.status = 'open';
    }

    const saved = await systemDb.upsertSupportTicket(ticket, sessionId);

    // Trigger Notifications (Migrated from tr_notify_admin_new_ticket and tr_notify_user_ticket_resolved)
    if (!existing) {
        // New ticket - notify admins
        const admins = await systemDb.findAllUserIdsByRole('admin');
        if (admins && admins.length > 0) {
            const { serviceRegistry } = await import('./service-registry');
            await serviceRegistry.systemService.notifyUsers({
                target_ids: admins,
                n_title: `New Support Ticket: ${saved.subject}`,
                n_msg: 'A new support ticket has been submitted by a user.',
                n_link: `grading:${saved.id}`, // placeholder deep link
                n_type: 'system'
            }, sessionId);
        }
    } else if (existing.status !== 'resolved' && saved.status === 'resolved') {
        // Resolved - notify owner
        const { serviceRegistry } = await import('./service-registry');
        await serviceRegistry.systemService.notifyUser({
            target_id: saved.user_id,
            n_title: `Support Ticket Resolved: ${saved.subject}`,
            n_msg: 'Your support ticket has been marked as resolved. Check the help center for details.',
            n_type: 'system'
        }, sessionId);
    }

    return saved;
  }

  async deleteSupportTicket(currentUser: User, id: string, sessionId: string): Promise<void> {
    const existing = await systemDb.findSupportTicketById(id, sessionId);
    if (!existing) throw new NotFoundError('Ticket not found');

    if (existing.user_id !== currentUser.id && !UserDomain.isAdmin(currentUser)) {
      throw new ForbiddenError('Unauthorized to delete this ticket');
    }

    await systemDb.deleteSupportTicket(id, sessionId);
  }

  async createBroadcast(broadcast: Partial<Broadcast>, sessionId: string): Promise<Broadcast> {
    // Idempotency: Prevent identical broadcasts within 1 hour
    const recentBroadcasts = await systemDb.findAllBroadcasts(sessionId);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingBroadcast = recentBroadcasts.find(b =>
        b.title === broadcast.title &&
        b.message === broadcast.message &&
        b.course_id === broadcast.course_id &&
        new Date(b.created_at) > oneHourAgo
    );

    if (existingBroadcast) {
        console.log(`[Broadcast] Skipping duplicate broadcast: ${broadcast.title}`);
        return existingBroadcast;
    }

    const broadcastToSave = CommunicationDomain.prepareBroadcast(broadcast);
    const createdBroadcast = await systemDb.createBroadcast(broadcastToSave, sessionId);

    // Asynchronous Fan-out using Task Queue to prevent request timeouts
    const { taskQueue } = await import('../queue/task-queue');
    taskQueue.enqueue(async () => {
        let targetUserIds: string[] = [];

        if (!createdBroadcast.course_id) {
            // Global broadcast
            targetUserIds = await systemDb.findAllUserIdsByRole(createdBroadcast.target_role || undefined);
        } else {
            // Course-specific broadcast
            const courseId = createdBroadcast.course_id;
            const targetRole = createdBroadcast.target_role;

            // 1. Get enrolled students
            if (!targetRole || targetRole === 'student') {
                const students = await systemDb.findEnrollmentStudentIds(courseId);
                targetUserIds.push(...students);
            }

            // 2. Get course teacher
            if (!targetRole || targetRole === 'teacher') {
                const { learningService } = await import('./learning.service');
                const course = await learningService.getCourse(courseId, sessionId);
                if (course?.teacher_id) targetUserIds.push(course.teacher_id);
            }

            // 3. Always include admins
            const admins = await systemDb.findAllUserIdsByRole('admin');
            targetUserIds.push(...admins);

            // Deduplicate
            targetUserIds = [...new Set(targetUserIds)];
        }

        if (targetUserIds.length > 0) {
            // Use broadcast ID as tag for broadcast notifications
            const pushTag = `broadcast:${createdBroadcast.id}`;

            // Batch insert in chunks of 500
            const chunkSize = 500;
            const insertedIds: { user_id: string, id: string }[] = [];

            for (let i = 0; i < targetUserIds.length; i += chunkSize) {
                const chunkIds = targetUserIds.slice(i, i + chunkSize);
                const notificationsToInsert = chunkIds.map(userId => ({
                    user_id: userId,
                    broadcast_id: createdBroadcast.id,
                    title: createdBroadcast.title,
                    message: createdBroadcast.message,
                    link: createdBroadcast.link || undefined,
                    type: createdBroadcast.type,
                    expires_at: createdBroadcast.expires_at || undefined,
                    metadata: { broadcast_id: createdBroadcast.id, expires_at: createdBroadcast.expires_at || '' }
                }));

                const data = await systemDb.createNotifications(notificationsToInsert, sessionId);
                if (data) {
                  insertedIds.push(...data.map(n => ({ user_id: n.user_id, id: n.id })));
                }
            }

            // Trigger Push Notifications for all targets in batch
            const { serviceRegistry } = await import('./service-registry');
            const subscriptions = await systemDb.findPushSubscriptionsByUserIds(targetUserIds, sessionId);

            if (subscriptions.length > 0) {
                const notificationMap = new Map(insertedIds.map(n => [n.user_id, n.id]));

                const pushTasks = subscriptions.map(async (sub) => {
                    const notificationId = notificationMap.get(sub.user_id);
                    const results = await serviceRegistry.pushService.sendToMany([sub], {
                        title: createdBroadcast.title,
                        body: createdBroadcast.message,
                        tag: notificationId || pushTag,
                        data: { url: createdBroadcast.link || '/' }
                    });

                    // Cleanup invalid subscriptions
                    if (results[0] && !results[0].success && results[0].expired) {
                        await systemDb.deletePushSubscription(sub.endpoint, sessionId);
                    }
                });

                await Promise.all(pushTasks);
            }
        }
    });

    return createdBroadcast;
  }

  // Maintenance Tasks
  async performSystemCleanup(sessionId: string): Promise<void> {
    const now = new Date().toISOString();

    // Cleanup expired notifications
    await systemDb.cleanupExpiredNotifications(now, sessionId);

    // Cleanup expired sessions
    await systemDb.cleanupExpiredSessions(now, sessionId);

    // Cleanup expired broadcasts
    await systemDb.cleanupExpiredBroadcasts(now, sessionId);

    // Cleanup very old push subscriptions (> 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    await systemDb.cleanupStalePushSubscriptions(ninetyDaysAgo, sessionId);
  }

  // Stats & Health
  async getSystemStats(sessionId: string): Promise<Record<string, number>> {
    return systemDb.getSystemStats(sessionId);
  }

  async getHealthMetrics(sessionId: string): Promise<unknown> {
    return systemDb.getHealthMetrics(sessionId);
  }

  // Storage
  async uploadFile(file: File, category: string, userId: string, sessionId: string): Promise<{ filePath: string, publicUrl: string }> {
    // File Validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf', 'application/zip', 'application/x-zip-compressed',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
    ];

    if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestError(`File size exceeds 10MB limit (size: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new BadRequestError(`File type ${file.type} is not allowed. Allowed types: images, PDF, Word, Zip, Text.`);
    }

    const fileName = file.name;
    const filePath = `${category}/${userId}/${Date.now()}_${fileName}`;
    const buffer = await file.arrayBuffer();

    await systemDb.uploadFile(filePath, buffer, file.type, sessionId);

    const publicUrl = systemDb.getPublicUrl(filePath);

    await this.createLogAsync({
        level: 'info',
        category: 'management',
        message: `File uploaded: ${fileName} in category ${category}`,
        user_id: userId,
        metadata: { filePath, publicUrl }
    });

    return { filePath, publicUrl };
  }
}

export const systemService = new SystemService();
