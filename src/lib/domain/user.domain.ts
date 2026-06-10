import { User } from '../types';
import { rbac } from '../auth/rbac';

export class UserDomain {
  static validateUpdate(currentUser: User, targetUserId: string): void {
    if (!rbac.can(currentUser, 'user:manage') && currentUser.id !== targetUserId) {
      throw new Error('Forbidden');
    }
  }

  static isAdmin(user: User): boolean {
    return user.role === 'admin';
  }

  static isTeacher(user: User): boolean {
    return user.role === 'teacher';
  }

  static isStudent(user: User): boolean {
    return user.role === 'student';
  }

  static canManageUsers(user: User): boolean {
    return rbac.can(user, 'user:manage');
  }

  static canManageContent(user: User): boolean {
    return rbac.can(user, 'course:create') || rbac.can(user, 'lesson:manage');
  }

  static filterUpdateFields(currentUser: User, updates: Partial<User>): Partial<User> {
    if (rbac.can(currentUser, 'user:manage')) {
      return updates;
    }

    const allowedFields: Array<keyof User> = ['full_name', 'phone', 'notification_preferences', 'metadata'];
    const filteredUpdates: Partial<User> = {};
    allowedFields.forEach(field => {
      if (field in updates) {
        (filteredUpdates as Record<string, unknown>)[field as string] = updates[field];
      }
    });
    return filteredUpdates;
  }
}
