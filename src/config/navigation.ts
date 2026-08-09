import type { ReactNode } from 'react';
import {
  LayoutDashboard, BookOpen, Library, FileText, HelpCircle, BarChart3,
  MessageSquare, Calendar, FileCode, Video, ShieldCheck, Settings,
  CircleHelp, BookMarked, Users, RefreshCw, LineChart, Activity, Info,
  Award, TrendingUp, Megaphone, LifeBuoy, MailPlus, Radio, AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import React from 'react';
import type { UserRole, User } from '@/lib/types';
import { rbac, type Permission } from '@/lib/auth/rbac';

export interface NavItem {
  /** Stable id; also used as the URL leaf (empty = role index). */
  id: string;
  label: string;
  icon: ReactNode;
  /** Optional RBAC gate. Item is hidden when the user lacks the permission. */
  permission?: Permission;
}

const icon = (Cmp: React.ComponentType<{ size?: number }>) =>
  React.createElement(Cmp, { size: 20 });

/**
 * Single source of truth for sidebar navigation per role.
 * Consumed by UnifiedSidebar, breadcrumbs, command palette, and tests.
 * `id === ''` (or `'dashboard'`) maps to the role index route (e.g. /student).
 */
export const NAVIGATION: Record<UserRole, NavItem[]> = {
  student: [
    { id: 'dashboard',   label: 'Dashboard',      icon: icon(LayoutDashboard) },
    { id: 'courses',     label: 'Course Catalog', icon: icon(BookOpen),    permission: 'course:view' },
    { id: 'my-courses',  label: 'My Courses',     icon: icon(Library),     permission: 'course:view' },
    { id: 'assignments', label: 'Assignments',    icon: icon(FileText),    permission: 'assignment:submit' },
    { id: 'quizzes',     label: 'Quizzes',        icon: icon(HelpCircle),  permission: 'quiz:take' },
    { id: 'grades',      label: 'Grades',         icon: icon(BookMarked) },
    { id: 'analytics',   label: 'Analytics',      icon: icon(BarChart3) },
    { id: 'discussions', label: 'Discussions',    icon: icon(MessageSquare) },
    { id: 'calendar',    label: 'Calendar',       icon: icon(Calendar) },
    { id: 'materials',   label: 'Materials',      icon: icon(FileCode),    permission: 'lesson:view' },
    { id: 'planner',     label: 'Planner',        icon: icon(Calendar) },
    { id: 'live',        label: 'Live Classes',   icon: icon(Video) },
    { id: 'anti-cheat',  label: 'Anti-Cheat',     icon: icon(ShieldCheck) },
    { id: 'progress',    label: 'Study Progress', icon: icon(TrendingUp) },
    { id: 'certificates', label: 'Certificates',  icon: icon(Award),       permission: 'certificate:view' },
    { id: 'settings',    label: 'Settings',       icon: icon(Settings) },
    { id: 'help',        label: 'Help',           icon: icon(CircleHelp) },
  ],
  teacher: [
    { id: 'dashboard',   label: 'Dashboard',      icon: icon(LayoutDashboard) },
    { id: 'courses',     label: 'Courses',        icon: icon(BookOpen),    permission: 'course:view' },
    { id: 'materials',   label: 'Materials',      icon: icon(FileCode),    permission: 'lesson:manage' },
    { id: 'assignments', label: 'Assignments',    icon: icon(FileText),    permission: 'assignment:manage' },
    { id: 'grading',     label: 'Grading Queue',  icon: icon(BarChart3),   permission: 'assignment:grade' },
    { id: 'gradebook',   label: 'Grade Book',     icon: icon(BookMarked),  permission: 'assignment:grade' },
    { id: 'students',    label: 'Students',       icon: icon(Users),       permission: 'user:view' },
    { id: 'discussions', label: 'Discussions',    icon: icon(MessageSquare) },
    { id: 'calendar',    label: 'Calendar',       icon: icon(Calendar) },
    { id: 'quizzes',     label: 'Quizzes',        icon: icon(HelpCircle),  permission: 'quiz:manage' },
    { id: 'certificates', label: 'Certificates',  icon: icon(Award),       permission: 'certificate:manage' },
    { id: 'help',        label: 'Help',           icon: icon(CircleHelp) },
    { id: 'live',        label: 'Live Classes',   icon: icon(Video) },
    { id: 'anti-cheat',  label: 'Anti-Cheat',     icon: icon(ShieldCheck) },
    { id: 'settings',    label: 'Settings',       icon: icon(Settings) },
  ],
  admin: [
    { id: 'dashboard',   label: 'Dashboard',              icon: icon(BarChart3) },
    { id: 'resets',      label: 'Password Resets',        icon: icon(RefreshCw),  permission: 'user:manage' },
    { id: 'users',       label: 'Users',                  icon: icon(Users),       permission: 'user:manage' },
    { id: 'invites',     label: 'Invites',                icon: icon(MailPlus),    permission: 'invite:manage' },
    { id: 'courses',     label: 'Course Oversight',       icon: icon(BookOpen),    permission: 'course:view' },
    { id: 'analytics',   label: 'Analytics',              icon: icon(LineChart) },
    { id: 'reports',     label: 'Reports',                icon: icon(ClipboardList), permission: 'report:view' },
    { id: 'broadcasts',  label: 'Broadcasts',             icon: icon(Megaphone),   permission: 'broadcast:manage' },
    { id: 'support',     label: 'Support Tickets',        icon: icon(LifeBuoy),    permission: 'ticket:manage' },
    { id: 'live-proctoring', label: 'Live Proctoring',    icon: icon(Radio),       permission: 'proctoring:monitor' },
    { id: 'violations',  label: 'Violations',             icon: icon(AlertTriangle), permission: 'proctoring:view' },
    { id: 'maintenance', label: 'System & Admin Control', icon: icon(ShieldCheck), permission: 'system:manage' },
    { id: 'health',      label: 'System Health',          icon: icon(Activity),    permission: 'system:logs:view' },
    { id: 'management',  label: 'System Management',      icon: icon(Settings),    permission: 'system:manage' },
    { id: 'settings',    label: 'Admin Settings',         icon: icon(Settings) },
    { id: 'help',        label: 'Help',                   icon: icon(CircleHelp) },
    { id: 'system',      label: 'System Info',            icon: icon(Info) },
  ],
};

export const ROLE_TITLES: Record<UserRole, string> = {
  student: 'SmartLMS',
  teacher: 'SmartLMS',
  admin:   'SmartLMS Admin',
};

/** Build the full URL for a nav item under a given role. */
export function navItemPath(role: UserRole, id: string): string {
  return id === 'dashboard' || id === '' ? `/${role}` : `/${role}/${id}`;
}

/** Filter nav items by RBAC for the given user. */
export function visibleNavItems(role: UserRole, user: User | null): NavItem[] {
  const items = NAVIGATION[role] ?? [];
  if (!user) return items.filter((i) => !i.permission);
  return items.filter((i) => !i.permission || rbac.can(user, i.permission));
}