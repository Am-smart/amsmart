import { Lesson, Material } from '../types';
import { sanitizeHtml } from '../utils';

export class LearningDomain {
  static validateLesson(lesson: Partial<Lesson>) {
    if (!lesson.title) throw new Error('Lesson title is required');
    if (!lesson.course_id) throw new Error('Course ID is required');
  }

  static validateMaterial(material: Partial<Material>) {
    if (!material.title) throw new Error('Material title is required');
    if (!material.file_url) throw new Error('File URL is required');
  }

  static prepareLesson(lesson: Partial<Lesson>): Partial<Lesson> {
    return {
      ...lesson,
      content: lesson.content ? sanitizeHtml(lesson.content) : lesson.content,
      order_index: lesson.order_index || 0
    };
  }

  static prepareMaterial(material: Partial<Material>, teacherId: string): Partial<Material> {
    return {
      ...material,
      teacher_id: material.teacher_id || teacherId
    };
  }
}
