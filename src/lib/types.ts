export type UserRole = 'student' | 'teacher' | 'admin';

export interface ResetRequest {
  status: 'pending' | 'approved' | 'denied' | 'approved_used';
  requested_at: string;
  reason?: string;
  risk_level?: string;
  temp_password?: string;
  approved_at?: string;
  expires_at?: string;
  denial_reason?: string;
}

export interface User {
  id: string;
  sessionId?: string; // Internal: token hash
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  password?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  failed_attempts?: number;
  lockouts?: number;
  flagged?: boolean;
  locked_until?: string | null;
  reset_request?: ResetRequest | null;
  notification_preferences?: Record<string, boolean>;
  active?: boolean;
  password_change_required?: boolean;
  version?: number;
  metadata?: Record<string, any>;
}

export interface UserDTO {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at?: string;
  active?: boolean;
  password_change_required?: boolean;
  notification_preferences?: Record<string, boolean>;
  metadata?: Record<string, any>;
  flagged?: boolean;
  last_login?: string;
  failed_attempts?: number;
  lockouts?: number;
  locked_until?: string | null;
  reset_request?: ResetRequest | null;
  version?: number;
}

export interface AuthResponseDTO {
  success: boolean;
  user: UserDTO | null;
  error?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequestDTO {
  email: string;
  password?: string;
}

export interface SignupRequestDTO {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export interface Course {
  id: string;
  enrollment_id?: string;
  created_by?: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: string;
  max_enrollment?: number;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
  metadata?: Record<string, any>;
}

// CourseDTO is an alias for Course to maintain backward compatibility
export type CourseDTO = Course;

export interface Enrollment {
  course_id: string;
  student_id: string;
  enrolled_at?: string;
  progress: number;
  completed: boolean;
  courses?: Course;
  users?: User;
}

export interface EnrollmentDTO {
  course_id: string;
  student_id: string;
  enrolled_at?: string;
  progress: number;
  completed: boolean;
  course?: CourseDTO;
  student?: UserDTO;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url?: string;
  order_index: number;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

// LessonDTO is an alias for Lesson to maintain backward compatibility
export type LessonDTO = Lesson;

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

// AttachmentDTO is an alias for Attachment to maintain backward compatibility
export type AttachmentDTO = Attachment;

export interface Assignment {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  start_at?: string;
  due_date: string;
  status: 'draft' | 'published';
  points_possible: number;
  allow_late_submissions: boolean;
  anti_cheat_enabled: boolean;
  hard_enforcement: boolean;
  regrade_requests_enabled: boolean;
  late_penalty_applied?: number; // Added from Submission
  late_penalty_per_day?: number;
  allowed_extensions?: string[];
  created_at?: string;
  updated_at?: string;
  version?: number;
  questions: AssignmentQuestion[];
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  courses?: Course;
}

export interface QuestionDTO {
  id: string;
  text: string;
  type: 'mcq' | 'tf' | 'short' | 'essay' | 'file' | 'link';
  points: number;
  options?: string[];
  correct_answer?: string | number;
  hint?: string;
  explanation?: string;
  extensions?: string;
}

export interface AssignmentDTO {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  start_at?: string;
  due_date: string;
  status: 'draft' | 'published';
  points_possible: number;
  allow_late_submissions: boolean;
  late_penalty_per_day?: number;
  allowed_extensions?: string[];
  anti_cheat_enabled: boolean;
  hard_enforcement: boolean;
  regrade_requests_enabled: boolean;
  questions: QuestionDTO[];
  attachments?: AttachmentDTO[];
  course?: CourseDTO;
  version?: number;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface AssignmentQuestion {
  id: string;
  text: string;
  type: 'essay' | 'file' | 'link';
  points: number;
  correct_answer?: string | number;
  extensions?: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published';
  attempts_allowed: number;
  time_limit: number;
  passing_score: number;
  anti_cheat_enabled: boolean;
  hard_enforcement: boolean;
  shuffle_questions: boolean;
  start_at?: string;
  end_at?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
  questions: QuizQuestion[];
  metadata?: Record<string, any>;
  courses?: Course;
}

export interface QuizDTO {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published';
  attempts_allowed: number;
  time_limit: number;
  passing_score: number;
  anti_cheat_enabled: boolean;
  hard_enforcement: boolean;
  shuffle_questions: boolean;
  start_at?: string;
  end_at?: string;
  questions: QuestionDTO[];
  course?: CourseDTO;
  version?: number;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'tf' | 'short';
  points: number;
  options?: string[];
  correct_answer?: string | number;
  hint?: string;
  explanation?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  updated_at?: string;
  submission_text?: string;
  file_url?: string;
  answers?: Record<string, string | number | boolean>;
  question_scores?: Record<string, number>;
  response_feedback?: Record<string, string>;
  late_penalty_applied?: number;
  attachments?: Attachment[];
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  final_grade?: number;
  feedback?: string;
  regrade_request?: string | null;
  graded_at?: string;
  violation_count?: number;
  version?: number;
  assignments?: Assignment;
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface SubmissionDTO {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  updated_at?: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  final_grade?: number;
  late_penalty_applied?: number;
  feedback?: string;
  regrade_request?: string | null;
  submission_text?: string;
  file_url?: string;
  answers?: Record<string, string | number | boolean>;
  question_scores?: Record<string, number>;
  response_feedback?: Record<string, string>;
  violation_count?: number;
  graded_at?: string;
  version?: number;
  assignment?: AssignmentDTO;
  student?: UserDTO;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  answers: Record<string, string | number | boolean>;
  analytics?: Record<string, string | number | boolean>;
  status: 'in progress' | 'submitted';
  time_spent: number;
  started_at: string;
  submitted_at: string;
  updated_at?: string;
  violation_count?: number;
  version?: number;
  attempt_number?: number;
  quizzes?: Quiz;
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface QuizSubmissionDTO {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  status: 'in progress' | 'submitted';
  time_spent: number;
  started_at: string;
  answers?: Record<string, string | number | boolean>;
  submitted_at: string;
  updated_at?: string;
  violation_count?: number;
  attempt_number?: number;
  version?: number;
  quiz?: QuizDTO;
  student?: UserDTO;
}

export interface Notification {
  id: string;
  user_id: string;
  broadcast_id?: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  is_read: boolean;
  viewed_at?: string;
  dismissed_at?: string;
  acknowledged_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NotificationDTO {
  id: string;
  user_id: string;
  broadcast_id?: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  is_read: boolean;
  viewed_at?: string;
  dismissed_at?: string;
  acknowledged_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  version?: number;
  updated_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  user_agent?: string;
  ip_address?: string;
}

export interface Broadcast {
  id: string;
  course_id: string | null;
  target_role?: string | null;
  title: string;
  message: string;
  link?: string;
  type: string;
  expires_at?: string;
  version?: number;
  created_at: string;
}

export interface BroadcastDTO {
  id: string;
  course_id: string | null;
  target_role?: string | null;
  title: string;
  message: string;
  link?: string;
  type: string;
  expires_at?: string;
  created_at: string;
  version?: number;
  updated_at?: string;
}

export interface Maintenance {
  id: string;
  enabled: boolean;
  manual_until?: string;
  message?: string;
  schedules: MaintenanceSchedule[];
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceSchedule {
  start_at: string;
  end_at: string;
  reason?: string;
}

export interface MaintenanceDTO {
  id: string;
  enabled: boolean;
  message?: string;
  schedules: MaintenanceSchedule[];
  updated_at?: string;
}

export interface PlannerItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  version?: number;
  created_at: string;
  updated_at?: string;
}

export interface PlannerItemDTO {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  created_at: string;
  updated_at?: string;
  version?: number;
}

export interface LessonCompletion {
  id: string;
  student_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface LiveClass {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  room_name: string;
  meeting_url?: string;
  recording_url?: string;
  recurring_config?: Record<string, string | number | boolean>;
  metadata?: Record<string, any>;
  start_at: string;
  end_at: string;
  actual_end_at?: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  version?: number;
  created_at?: string;
  updated_at?: string;
  courses?: Course;
}

export interface LiveClassDTO {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  room_name: string;
  meeting_url?: string;
  recording_url?: string;
  recurring_config?: Record<string, string | number | boolean>;
  metadata?: Record<string, any>;
  start_at: string;
  end_at: string;
  actual_end_at?: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  version?: number;
  updated_at?: string;
  course?: CourseDTO;
}

export interface Attendance {
  id: string;
  live_class_id: string;
  student_id: string;
  join_time: string;
  leave_time?: string;
  duration?: number;
  is_present: boolean;
  created_at?: string;
}

export interface AttendanceDTO {
  id: string;
  live_class_id: string;
  student_id: string;
  join_time: string;
  leave_time?: string;
  duration?: number;
  is_present: boolean;
  created_at?: string;
  student?: UserDTO;
}

export interface Material {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  courses?: Course;
}

export interface MaterialDTO {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  course?: CourseDTO;
}

export interface Discussion {
  id: string;
  course_id: string;
  user_id: string;
  parent_id?: string;
  title?: string;
  content: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface DiscussionDTO {
  id: string;
  course_id: string;
  user_id: string;
  parent_id?: string;
  title?: string;
  content: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  user?: UserDTO;
}

export interface SystemLog {
  id?: string;
  level: string;
  category: string;
  message: string;
  metadata?: Record<string, any>;
  user_id?: string;
  course_id?: string;
  resource_id?: string;
  created_at?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface SystemLogDTO {
  id?: string;
  level: string;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  course_id?: string;
  resource_id?: string;
  created_at?: string;
  user?: UserDTO;
}

export interface AntiCheatLog {
  id?: string;
  user_id: string;
  course_id: string;
  resource_id?: string;
  type: string;
  message?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface AntiCheatLogDTO {
  id: string;
  user_id: string;
  course_id: string;
  resource_id?: string;
  type: string;
  message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  user?: UserDTO;
  course?: CourseDTO;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assigned_to?: string;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  version?: number;
  created_at: string;
  updated_at?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface SupportTicketDTO {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assigned_to?: string;
  resolved_at?: string;
  metadata?: Record<string, unknown>;
  version?: number;
  created_at: string;
  updated_at?: string;
  user?: UserDTO;
}

export interface Setting {
  key: string;
  value: string | number | boolean | Record<string, string | number | boolean>;
  updated_at?: string;
}

export interface SettingDTO {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  updated_at?: string;
}

export interface PushSubscriptionDTO {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface Invite {
  id: string;
  token_hash: string;
  email?: string;
  role: UserRole;
  type: 'email_bound' | 'role_only';
  created_by?: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
}

export interface InviteDTO {
  id: string;
  email?: string;
  role: UserRole;
  type: 'email_bound' | 'role_only';
  created_at: string;
  expires_at: string;
  used_at?: string;
}

/**
 * Database Agnostic Interfaces
 */
export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
  count?: number | null;
}

/**
 * Type Guards
 */
export function isAssignment(obj: unknown): obj is Assignment {
    return (obj as Assignment)?.questions !== undefined &&
           (obj as Assignment)?.due_date !== undefined &&
           !Object.prototype.hasOwnProperty.call(obj, 'attempts_allowed');
}

export function isQuiz(obj: unknown): obj is Quiz {
    return (obj as Quiz)?.questions !== undefined &&
           (obj as Quiz)?.attempts_allowed !== undefined;
}

export function isAssignmentDTO(obj: unknown): obj is AssignmentDTO {
    return (obj as AssignmentDTO)?.questions !== undefined &&
           (obj as AssignmentDTO)?.due_date !== undefined &&
           !Object.prototype.hasOwnProperty.call(obj, 'attempts_allowed');
}

export function isQuizDTO(obj: unknown): obj is QuizDTO {
    return (obj as QuizDTO)?.questions !== undefined &&
           (obj as QuizDTO)?.attempts_allowed !== undefined;
}
