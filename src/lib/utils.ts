import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserRole } from "./types";
import { USER_ROLES, ASSESSMENT_STATUS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses deep links in various formats (path-based, type:id, or keywords)
 * and returns a standard path for navigation.
 */
export const parseDeepLink = (link?: string, role: string = 'student'): string | null => {
  if (!link) return null;

  try {
    // Handle URL-style links
    if (link.startsWith('/')) {
      return link;
    }

    const base = role === 'teacher' ? 'teacher' : role === 'admin' ? 'admin' : 'student';

    // Handle structured links: type:id format
    if (link.includes(':')) {
      const [type, ...parts] = link.split(':');
      const id = parts[0];
      const subId = parts[1] || '';

      const routes: Record<string, string> = {
        course: `/${base}/courses?id=${id}`,
        assignment: `/${base}/assignments?id=${id}`,
        quiz: `/${base}/quizzes?id=${id}`,
        discussion: `/${base}/discussions?id=${id}`,
        material: `/${base}/materials?id=${id}`,
        live: `/${base}/live?id=${id}`,
        grading: role === 'teacher' ? `/teacher/grading?id=${id}` : role === 'admin' ? '/admin/management' : '/student/grades',
        students: role === 'teacher' ? `/teacher/students?id=${id}` : role === 'admin' ? '/admin/users' : '/student/dashboard',
        submission: role === 'teacher' ? `/teacher/grading?id=${id}` : role === 'admin' ? '/admin/management' : `/student/assignments?id=${id}`,
        lesson: `/${base}/courses?id=${id}&lessonId=${subId}`,
        'assignment-list': `/${base}/assignments`,
        'quiz-list': `/${base}/quizzes`,
        'live-list': `/${base}/live`,
      };

      if (routes[type]) {
          return routes[type];
      }
    }

    // Fallback for simple names
    if (['dashboard', 'courses', 'assignments', 'quizzes', 'live', 'calendar', 'settings'].includes(link)) {
        return `/${base}/${link}`;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
};

/**
 * Simple HTML sanitizer to prevent XSS
 */
export function sanitizeHtml(html: string): string {
    if (!html) return html;
    return html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
        .replace(/on\w+="[^"]*"/gim, "")
        .replace(/on\w+='[^']*'/gim, "")
        .replace(/javascript:[^"']*/gim, "");
}

/**
 * Type guard for UserRole
 */
export function isUserRole(role: unknown): role is UserRole {
    return (Object.values(USER_ROLES) as unknown[]).includes(role);
}

/**
 * Type guard for AssessmentStatus
 */
export function isAssessmentStatus(status: unknown): status is typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS] {
    return (Object.values(ASSESSMENT_STATUS) as unknown[]).includes(status);
}
