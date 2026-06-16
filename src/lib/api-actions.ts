export { apiClient } from './api-client';
import { apiClient } from './api-client';
import {
  User,
  UserRole,
  Course,
  Submission,
  QuizSubmission,
  Material,
  Discussion,
  PlannerItem,
  Session,
  LiveClass,
  UserDTO,
  CourseDTO,
  MaterialDTO,
  EnrollmentDTO,
  LessonDTO,
  AssignmentDTO,
  QuizDTO,
  SubmissionDTO,
  QuizSubmissionDTO,
  NotificationDTO,
  LiveClassDTO,
  AttendanceDTO,
  PlannerItemDTO,
  MaintenanceDTO,
  SettingDTO,
  SystemLogDTO,
  AntiCheatLogDTO,
  SupportTicket,
  SupportTicketDTO,
  SignupRequestDTO
} from './types';

// Standardized Response types
export interface ActionResponse<T = undefined> {
    success: boolean;
    data?: T;
    error?: string;
}

// Auth / Users
export async function login(credentials: { email: string; password?: string }): Promise<ActionResponse<{ user: UserDTO }>> {
  try {
    const result = await apiClient.post<{ user: UserDTO; error?: string }>('/api/v1/auth', { action: 'login', ...credentials });
    return { success: true, data: result as { user: UserDTO } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getAttendance(liveClassId: string): Promise<AttendanceDTO[]> {
    return apiClient.get<AttendanceDTO[]>(`/api/v1/system?action=attendance&liveClassId=${liveClassId}`);
}

export async function signup(userData: SignupRequestDTO): Promise<ActionResponse<{ user: UserDTO }>> {
  try {
    const result = await apiClient.post<{ user: UserDTO; error?: string }>('/api/v1/auth', { action: 'signup', ...userData });
    return { success: true, data: result as { user: UserDTO } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function logout(): Promise<ActionResponse> {
  try {
    await apiClient.post('/api/v1/auth', { action: 'logout' });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getMe(signal?: AbortSignal): Promise<UserDTO | null> {
    try {
        return await apiClient.get<UserDTO>('/api/v1/auth?action=me', { signal });
    } catch {
        return null;
    }
}

export async function getSessions(): Promise<Session[]> {
    return apiClient.get<Session[]>('/api/v1/system?action=sessions');
}

export async function updateProfile(updates: Partial<User>): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/auth', { action: 'profile', ...updates });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUsers(): Promise<UserDTO[]> {
  return apiClient.get<UserDTO[]>('/api/v1/system?action=users');
}

export async function deleteUser(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/system?action=user&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function saveUser(user: Partial<User> & { id?: string }): Promise<ActionResponse<UserDTO>> {
  try {
    const data = await apiClient.post<UserDTO>('/api/v1/system', { action: 'save-user', ...user });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function approveResetRequest(userId: string, tempPass: string): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/auth', { userId, tempPassword: tempPass, action: 'reset-request', subAction: 'approve' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function denyResetRequest(userId: string, reason: string): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/auth', { userId, reason, action: 'reset-request', subAction: 'deny' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function saveLiveClass(liveClass: Partial<LiveClass>): Promise<ActionResponse<LiveClassDTO>> {
    try {
        const data = await apiClient.post<LiveClassDTO>('/api/v1/system', { action: 'save-live-class', ...liveClass });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteLiveClass(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/system?action=live-class&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteAssignment(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/assessment?action=assignment&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deletePlannerItem(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/system?action=planner&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Courses
export async function getCourses(teacherId?: string, limit?: number, offset?: number): Promise<CourseDTO[]> {
  let url = teacherId ? '/api/v1/learning?action=courses&teacherId=' + teacherId : '/api/v1/learning?action=courses';
  if (limit) url += `&limit=${limit}`;
  if (offset) url += `&offset=${offset}`;
  return apiClient.get<CourseDTO[]>(url);
}

export async function saveCourse(course: Partial<Course>): Promise<ActionResponse<CourseDTO>> {
  try {
    const data = await apiClient.post<CourseDTO>('/api/v1/learning', { action: 'save-course', ...course });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteQuiz(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/assessment?action=quiz&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Enrollments
export async function getEnrollments(studentId?: string, courseIds?: string[], signal?: AbortSignal): Promise<EnrollmentDTO[]> {
  let url = '/api/v1/system?action=enrollments';
  if (studentId) url += `&studentId=${studentId}`;
  if (courseIds) url += `&courseIds=${courseIds.join(',')}`;
  return apiClient.get<EnrollmentDTO[]>(url, { signal });
}

export async function enrollInCourse(courseId: string, enrollmentCode?: string): Promise<ActionResponse> {
  try {
    await apiClient.post('/api/v1/system', { action: 'enroll', courseId, enrollmentCode });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function unenrollStudent(courseId: string, studentId: string): Promise<ActionResponse> {
  try {
    await apiClient.delete(`/api/v1/system?action=enrollment&id=${courseId}&studentId=${studentId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCourse(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/learning?action=course&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Assignments
export async function getAssignments(teacherId?: string, courseId?: string, limit?: number, offset?: number): Promise<AssignmentDTO[]> {
  let url = '/api/v1/assessment?action=assignments';
  if (teacherId) url += `&teacherId=${teacherId}`;
  if (courseId) url += `&courseId=${courseId}`;
  if (limit) url += `&limit=${limit}`;
  if (offset) url += `&offset=${offset}`;
  return apiClient.get<AssignmentDTO[]>(url);
}

export async function saveAssignment(assignment: Omit<AssignmentDTO, 'course' | 'metadata'>): Promise<ActionResponse<AssignmentDTO>> {
  try {
    const data = await apiClient.post<AssignmentDTO>('/api/v1/assessment', { action: 'save-assignment', ...assignment });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function submitAssignment(assignmentId: string, content: Partial<Submission>): Promise<ActionResponse<SubmissionDTO>> {
  try {
    const data = await apiClient.post<SubmissionDTO>('/api/v1/assessment', { action: 'submit-assignment', assignmentId, ...content });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getSubmissions(filters: { assignmentId?: string; studentId?: string; status?: string; courseId?: string; limit?: number; offset?: number } = {}): Promise<SubmissionDTO[]> {
    let url = '/api/v1/assessment?action=submissions';
    if (filters.assignmentId) url += `&assignmentId=${filters.assignmentId}`;
    if (filters.studentId) url += `&studentId=${filters.studentId}`;
    if (filters.status) url += `&status=${filters.status}`;
    if (filters.courseId) url += `&courseId=${filters.courseId}`;
    if (filters.limit) url += `&limit=${filters.limit}`;
    if (filters.offset) url += `&offset=${filters.offset}`;
    return apiClient.get<SubmissionDTO[]>(url);
}

export async function gradeSubmission(id: string, gradeData: Partial<Submission>): Promise<ActionResponse> {
    try {
        await apiClient.patch(`/api/v1/assessment?action=grade-submission&id=${id}`, gradeData);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Quizzes
export async function getQuizzes(courseId?: string, teacherId?: string, limit?: number, offset?: number): Promise<QuizDTO[]> {
  let url = '/api/v1/assessment?action=quizzes';
  if (courseId) url += `&courseId=${courseId}`;
  if (teacherId) url += `&teacherId=${teacherId}`;
  if (limit) url += `&limit=${limit}`;
  if (offset) url += `&offset=${offset}`;
  return apiClient.get<QuizDTO[]>(url);
}

export async function saveQuiz(quiz: Omit<QuizDTO, 'course' | 'metadata'>): Promise<ActionResponse<QuizDTO>> {
  try {
    const data = await apiClient.post<QuizDTO>('/api/v1/assessment', { action: 'save-quiz', ...quiz });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function submitQuiz(quizId: string, content: Partial<QuizSubmission>): Promise<ActionResponse<{ score: number }>> {
  try {
    const result = await apiClient.post<{ score: number }>('/api/v1/assessment', { action: 'submit-quiz', quizId, ...content });
    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getQuizSubmissions(quizId?: string, studentId?: string, courseId?: string): Promise<QuizSubmissionDTO[]> {
    let url = '/api/v1/system?action=quiz-submissions';
    if (quizId) url += `&quizId=${quizId}`;
    if (studentId) url += `&studentId=${studentId}`;
    if (courseId) url += `&courseId=${courseId}`;
    return apiClient.get<QuizSubmissionDTO[]>(url);
}

// Materials
export async function getMaterials(courseId?: string): Promise<MaterialDTO[]> {
  const url = courseId ? `/api/v1/learning?action=materials&courseId=${courseId}` : '/api/v1/learning?action=materials';
  return apiClient.get<MaterialDTO[]>(url);
}

export async function saveMaterial(material: Partial<Material>): Promise<ActionResponse<MaterialDTO>> {
  try {
    const data = await apiClient.post<MaterialDTO>('/api/v1/learning', { action: 'save-material', ...material });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteMaterial(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/learning?action=material&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteLesson(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/learning?action=lesson&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Lessons
export async function getLessons(courseId: string): Promise<LessonDTO[]> {
    return apiClient.get<LessonDTO[]>(`/api/v1/learning?action=lessons&courseId=${courseId}`);
}

export async function saveLesson(lesson: Partial<LessonDTO>): Promise<ActionResponse<LessonDTO>> {
    try {
        const data = await apiClient.post<LessonDTO>('/api/v1/learning', { action: 'save-lesson', ...lesson });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function markLessonComplete(lessonId: string, courseId: string): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/system', { action: 'lesson-completion', lessonId, courseId });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getLessonCompletions(userId?: string): Promise<Record<string, unknown>[]> {
    let url = '/api/v1/system?action=lesson-completions';
    if (userId) url += `&userId=${userId}`;
    return apiClient.get<Record<string, unknown>[]>(url);
}

// Discussions
export async function getDiscussions(courseId: string): Promise<Discussion[]> {
  return apiClient.get<Discussion[]>(`/api/v1/system?action=discussions&courseId=${courseId}`);
}

export async function saveDiscussionPost(discussion: Partial<Discussion>): Promise<ActionResponse<Discussion>> {
  try {
    const data = await apiClient.post<Discussion>('/api/v1/system', { action: 'save-discussion', ...discussion });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteDiscussionPost(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/system?action=discussion&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Notifications
export async function getNotifications(userId: string): Promise<NotificationDTO[]> {
  if (!userId || userId === 'undefined' || userId === 'null') return [];
  return apiClient.get<NotificationDTO[]>(`/api/v1/system?action=notifications&userId=${userId}`);
}

export async function createBroadcast(broadcast: unknown): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/system', { action: 'broadcast', ...broadcast as object });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Maintenance
export async function getMaintenance(): Promise<MaintenanceDTO> {
  return apiClient.get<MaintenanceDTO>('/api/v1/system?action=maintenance');
}

export async function updateMaintenance(data: unknown): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/system', { action: 'update-maintenance', ...data as object });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// System Logs & Anti-Cheat
export async function getSystemLogs(limit: number = 100): Promise<SystemLogDTO[]> {
    return apiClient.get<SystemLogDTO[]>(`/api/v1/system?action=logs&limit=${limit}`);
}

export async function getAntiCheatLogs(filters: { userId?: string, courseId?: string, resourceId?: string, limit?: number, offset?: number } = {}): Promise<AntiCheatLogDTO[]> {
    let url = '/api/v1/system?action=anti-cheat-logs';
    if (filters.userId) url += `&userId=${filters.userId}`;
    if (filters.courseId) url += `&courseId=${filters.courseId}`;
    if (filters.resourceId) url += `&resourceId=${filters.resourceId}`;
    if (filters.limit) url += `&limit=${filters.limit}`;
    if (filters.offset !== undefined) url += `&offset=${filters.offset}`;
    return apiClient.get<AntiCheatLogDTO[]>(url);
}

// Support Tickets
export async function getSupportTickets(filters: { user_id?: string; assigned_to?: string; status?: string } = {}): Promise<SupportTicketDTO[]> {
    let url = '/api/v1/system?action=support-tickets';
    if (filters.user_id) url += `&userId=${filters.user_id}`;
    if (filters.assigned_to) url += `&assignedTo=${filters.assigned_to}`;
    if (filters.status) url += `&status=${filters.status}`;
    return apiClient.get<SupportTicketDTO[]>(url);
}

export async function saveSupportTicket(ticket: Partial<SupportTicket>): Promise<ActionResponse<SupportTicketDTO>> {
    try {
        const data = await apiClient.post<SupportTicketDTO>('/api/v1/system', { action: 'save-ticket', ...ticket });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteSupportTicket(id: string): Promise<ActionResponse> {
    try {
        await apiClient.delete(`/api/v1/system?action=ticket&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<ActionResponse> {
    try {
        await apiClient.patch(`/api/v1/system?action=ticket&id=${id}`, updates);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function logAntiCheatViolation(data: Record<string, unknown> & { type: string, message?: string; courseId?: string; resourceId?: string }): Promise<ActionResponse> {
  try {
    await apiClient.post('/api/v1/system', {
        action: 'anti-cheat-log',
        type: data.type,
        message: data.message || `Anti-cheat violation: ${data.type}`,
        course_id: data.courseId,
        resource_id: data.resourceId,
        metadata: data
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

// Planner
export async function getPlannerItems(userId: string): Promise<PlannerItemDTO[]> {
    return apiClient.get<PlannerItemDTO[]>(`/api/v1/system?action=planner&userId=${userId}`);
}

export async function savePlannerItem(planner: Partial<PlannerItem>): Promise<ActionResponse<PlannerItemDTO>> {
    try {
        const data = await apiClient.post<PlannerItemDTO>('/api/v1/system', { action: 'save-planner', ...planner });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Settings
export async function getSettings(): Promise<SettingDTO[]> {
    return apiClient.get<SettingDTO[]>('/api/v1/system?action=settings');
}

export async function getSystemStats(): Promise<Record<string, number>> {
    return apiClient.get<Record<string, number>>('/api/v1/system?action=stats');
}

export async function getHealthMetrics(): Promise<unknown> {
    return apiClient.get<unknown>('/api/v1/system?action=health');
}

export async function clearCache(): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/system', { action: 'clear-cache' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function updateSetting(key: string, value: unknown): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/system', { action: 'update-setting', key, value });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Live Classes
export async function getLiveClasses(courseId?: string, teacherId?: string): Promise<LiveClassDTO[]> {
    let url = '/api/v1/system?action=live-classes';
    if (courseId) url += `&courseId=${courseId}`;
    if (teacherId) url += `&teacherId=${teacherId}`;
    return apiClient.get<LiveClassDTO[]>(url);
}

export async function recordAttendance(liveClassId: string): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/system', { action: 'attendance', liveClassId });
        return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

// File Upload Path
export async function uploadFile(fileName: string, category: string): Promise<{ filePath: string }> {
    return apiClient.post<{ filePath: string }>('/api/v1/system', { action: 'upload-path', fileName, category });
}

// Notifications
export async function markNotificationAsRead(notificationId: string): Promise<ActionResponse> {
    try {
        await apiClient.patch(`/api/v1/system?action=notification&id=${notificationId}`, {});
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

export async function markNotificationsAsViewed(ids: string[]): Promise<ActionResponse> {
    try {
        await apiClient.patch('/api/v1/system?action=notification&subAction=view', { ids });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}


export async function dismissNotification(notificationId: string): Promise<ActionResponse> {
    try {
        await apiClient.patch(`/api/v1/system?action=notification&subAction=dismiss&id=${notificationId}`, {});
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

export async function acknowledgeNotification(notificationId: string): Promise<ActionResponse> {
    try {
        await apiClient.patch(`/api/v1/system?action=notification&subAction=acknowledge&id=${notificationId}`, {});
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<ActionResponse> {
    try {
        await apiClient.patch(`/api/v1/system?action=notification&userId=${userId}`, { markAll: true });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

// Auth - Password Management
export async function updatePassword(currentPassword: string, newPassword: string): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/auth', { action: 'password', currentPassword, newPassword });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

export async function requestPasswordReset(email: string, reason: string, riskLevel: string): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/auth', { action: 'reset-request', subAction: 'request', email, reason, riskLevel });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

// Auth - User Info
export async function getRoleCount(): Promise<{ teachers: number; admins: number; total: number }> {
    return apiClient.get<{ teachers: number; admins: number; total: number }>('/api/v1/auth?action=role-count');
}

// User Preferences
export async function updatePreferences(preferences: Record<string, unknown>): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/auth', { action: 'preferences', preferences });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

export async function generateInvite(role: UserRole, email?: string): Promise<ActionResponse<{ token: string; link: string }>> {
    try {
        const data = await apiClient.post<{ token: string; link: string }>('/api/v1/auth', { action: 'generate-invite', role, email });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getInviteSession(): Promise<Record<string, unknown> | null> {
    return apiClient.get('/api/v1/auth?action=invite-session');
}

// System Logging
export async function createSystemLog(data: { level: string; category: string; message: string; metadata?: unknown }): Promise<ActionResponse> {
    try {
        await apiClient.post('/api/v1/system', { action: 'log', ...data });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}
