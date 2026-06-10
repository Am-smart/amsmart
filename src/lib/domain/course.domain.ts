import { Course } from '../types';

export class CourseDomain {
  static create(data: Partial<Course>, teacherId: string, teacherName?: string): Partial<Course> {
    return {
      ...data,
      teacher_id: data.teacher_id || teacherId,
      created_by: data.created_by || teacherName,
      status: data.status || 'draft',
    };
  }

  static validate(course: Partial<Course>): void {
    if (!course.title || course.title.trim() === '') {
      throw new Error('Course title is required');
    }

    if (course.status && !['draft', 'published', 'archived'].includes(course.status)) {
      throw new Error('Invalid course status');
    }

    if (course.max_enrollment !== undefined && (course.max_enrollment < 0 || !Number.isInteger(course.max_enrollment))) {
      throw new Error('Max enrollment must be a non-negative integer');
    }
  }
}
