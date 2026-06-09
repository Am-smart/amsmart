import { User, UserRole } from '../types';

export type Permission =
  | 'course:create' | 'course:update' | 'course:delete' | 'course:view'
  | 'lesson:manage' | 'lesson:view'
  | 'assignment:manage' | 'assignment:submit' | 'assignment:grade'
  | 'quiz:manage' | 'quiz:take'
  | 'user:manage' | 'user:view'
  | 'system:manage' | 'system:logs:view'
  | 'ticket:view' | 'ticket:create' | 'ticket:manage';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'course:create', 'course:update', 'course:delete', 'course:view',
    'lesson:manage', 'lesson:view',
    'assignment:manage', 'assignment:submit', 'assignment:grade',
    'quiz:manage', 'quiz:take',
    'user:manage', 'user:view',
    'system:manage', 'system:logs:view',
    'ticket:view', 'ticket:create', 'ticket:manage'
  ],
  teacher: [
    'course:create', 'course:update', 'course:view',
    'lesson:manage', 'lesson:view',
    'assignment:manage', 'assignment:grade',
    'quiz:manage',
    'user:view',
    'ticket:view', 'ticket:create', 'ticket:manage'
  ],
  student: [
    'course:view',
    'lesson:view',
    'assignment:submit',
    'quiz:take',
    'user:view',
    'ticket:view', 'ticket:create'
  ]
};

export class AuthorizationEngine {
  can(user: User, permission: Permission): boolean {
    if (!user || !user.role) return false;

    // Safety checks: deactivated or locked users have no permissions
    if (user.active === false) return false;
    if (user.password_change_required) return false;
    if (user.locked_until && new Date(user.locked_until) > new Date()) return false;

    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  }

  isOwner(user: User, entity: { teacher_id?: string; user_id?: string; student_id?: string }): boolean {
    if (user.role === 'admin') return true;
    return (
      (entity.teacher_id && entity.teacher_id === user.id) ||
      (entity.user_id && entity.user_id === user.id) ||
      (entity.student_id && entity.student_id === user.id) ||
      false
    );
  }

  canManageCourse(user: User, course: { teacher_id: string }): boolean {
    return user.role === 'admin' || (user.role === 'teacher' && course.teacher_id === user.id);
  }

  canGradeSubmission(user: User, course: { teacher_id: string }): boolean {
    return user.role === 'admin' || (user.role === 'teacher' && course.teacher_id === user.id);
  }
}

export const rbac = new AuthorizationEngine();
