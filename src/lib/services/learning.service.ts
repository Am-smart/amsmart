import { learningDb } from '../database/learning.db';
import { Course, Lesson, Material, LessonCompletion, User } from '../types';
import { CourseDomain } from '../domain/course.domain';
import { LearningDomain } from '../domain/learning.domain';
import { NotFoundError, ForbiddenError, BadRequestError } from '../api-error';

export class LearningService {
  // Courses
  async getCourse(id: string, sessionId: string): Promise<Course> {
    const course = await learningDb.findCourseById(id, sessionId);
    if (!course) throw new NotFoundError('Course not found');
    return course;
  }

  async getCourses(teacherId?: string, sessionId?: string, limit?: number, offset?: number): Promise<Course[]> {
    return learningDb.findAllCourses(teacherId, sessionId!, limit, offset);
  }

  async saveCourse(teacherId: string, teacherName: string, course: Partial<Course>, sessionId: string, currentUser?: User): Promise<Course> {
    CourseDomain.validate(course);

    if (course.id) {
        const existing = await learningDb.findCourseById(course.id, sessionId);
        if (existing) {
            if (currentUser && currentUser.role !== 'admin' && existing.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only update your own courses');
            }
        }
    }

    const courseToSave = CourseDomain.create(course, teacherId, teacherName);

    return learningDb.upsertCourse(courseToSave, sessionId);
  }

  async deleteCourse(id: string, sessionId: string, currentUser?: User): Promise<void> {
    const existing = await learningDb.findCourseById(id, sessionId);
    if (existing) {
        if (currentUser && currentUser.role !== 'admin' && existing.teacher_id !== currentUser.id) {
            throw new ForbiddenError('Unauthorized: You can only delete your own courses');
        }
    }
    await learningDb.deleteCourse(id, sessionId);
  }

  // Lessons
  async getLessons(courseId: string, sessionId: string, userId?: string, userRole?: string): Promise<Lesson[]> {
    if (userRole === 'student' && userId) {
        const enrollment = await learningDb.findEnrollmentByCourseAndStudent(courseId, userId, sessionId);
        if (!enrollment) return [];
    }
    return learningDb.findLessonsByCourseId(courseId, sessionId);
  }

  async saveLesson(lesson: Partial<Lesson>, sessionId: string, currentUser?: User): Promise<Lesson> {
    LearningDomain.validateLesson(lesson);

    const isNew = !lesson.id;
    if (currentUser && currentUser.role === 'teacher') {
        let courseId = lesson.course_id;
        if (!courseId && lesson.id) {
            const existing = await learningDb.findLessonById(lesson.id, sessionId);
            if (existing) courseId = existing.course_id;
        }

        if (courseId) {
            const course = await learningDb.findCourseById(courseId, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage lessons for your own courses');
            }
        }
    }

    const lessonToSave = LearningDomain.prepareLesson(lesson);

    // Order index conflict detection
    if (lessonToSave.course_id && lessonToSave.order_index !== undefined) {
        const existingLessons = await learningDb.findLessonsByCourseId(lessonToSave.course_id, sessionId);
        const duplicate = existingLessons.find(l => l.order_index === lessonToSave.order_index && l.id !== lessonToSave.id);
        if (duplicate) {
            throw new BadRequestError(`Order index ${lessonToSave.order_index} is already taken in this course`);
        }
    }

    const saved = await learningDb.upsertLesson(lessonToSave, sessionId);

    // Trigger Notification (Migrated from tr_lesson_created)
    if (isNew) {
        const { serviceRegistry } = await import('./service-registry');
        await serviceRegistry.systemService.createBroadcast({
            course_id: saved.course_id,
            target_role: 'student',
            title: 'New Lesson Available',
            message: `A new lesson "${saved.title}" has been added.`,
            link: `course:${saved.course_id}`, // Link to course view (the entry point for lessons)
            type: 'lesson',
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }, sessionId);
    }

    return saved;
  }

  async deleteLesson(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'teacher') {
        const lesson = await learningDb.findLessonById(id, sessionId);
        if (lesson) {
            const course = await learningDb.findCourseById(lesson.course_id, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage lessons for your own courses');
            }
        }
    }
    await learningDb.deleteLesson(id, sessionId);
  }

  // Materials
  async getMaterials(courseId: string | undefined, sessionId: string, userId?: string, userRole?: string, options: { limit?: number; offset?: number } = {}): Promise<Material[]> {
    if (userRole === 'student' && userId) {
        const enrollments = await learningDb.findEnrollmentsByStudentId(userId, sessionId);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const materials = await learningDb.findAllMaterials(courseId, sessionId, undefined, options);
        return materials.filter(m => enrolledCourseIds.includes(m.course_id));
    }

    if (userRole === 'teacher' && userId) {
        return learningDb.findAllMaterials(courseId, sessionId, userId, options);
    }

    return learningDb.findAllMaterials(courseId, sessionId, undefined, options);
  }

  async saveMaterial(teacherId: string, material: Partial<Material>, sessionId: string, currentUser?: User): Promise<Material> {
    LearningDomain.validateMaterial(material);

    if (currentUser && currentUser.role === 'teacher') {
        let courseId = material.course_id;
        if (!courseId && material.id) {
            const existing = await learningDb.findMaterialById(material.id, sessionId);
            if (existing) courseId = existing.course_id;
        }

        if (courseId) {
            const course = await learningDb.findCourseById(courseId, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage materials for your own courses');
            }
        }
    }

    const materialToSave = LearningDomain.prepareMaterial(material, teacherId);
    return learningDb.upsertMaterial(materialToSave, sessionId);
  }

  async deleteMaterial(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'teacher') {
        const material = await learningDb.findMaterialById(id, sessionId);
        if (material) {
            const course = await learningDb.findCourseById(material.course_id, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage materials for your own courses');
            }
        }
    }
    await learningDb.deleteMaterial(id, sessionId);
  }


  // Progress & Completions
  async markLessonComplete(studentId: string, lessonId: string, courseId: string, sessionId: string): Promise<{ success: boolean }> {
    // 1. Verify enrollment before proceeding
    const enrollment = await learningDb.findEnrollmentByCourseAndStudent(courseId, studentId, sessionId);
    if (!enrollment) throw new ForbiddenError('Student is not enrolled in this course');

    try {
        // 2. Mark lesson as complete (Idempotent in DB via UNIQUE constraint)
        await learningDb.markLessonComplete(studentId, lessonId, sessionId);

        // 3. Update progress atomically (as a single logical operation following completion)
        const lessons = await learningDb.findLessonsByCourseId(courseId, sessionId);
        const lessonIds = lessons.map(l => l.id);
        const completedIds = await learningDb.findLessonCompletions(studentId, lessonIds, sessionId);

        const totalLessons = lessons.length;
        const progress = totalLessons > 0 ? Math.round(((completedIds.length || 0) / totalLessons) * 100) : 0;

        // Only update if progress has actually changed to minimize DB writes
        if (progress !== enrollment.progress) {
            await learningDb.updateEnrollmentProgress(studentId, courseId, progress, sessionId);
        }
    } catch (error) {
        console.error(`[Consistency] Progress sync failed for user ${studentId} in course ${courseId}. Retrying...`);
        // Fallback: Re-verify progress in a background task if first attempt fails
        const { taskQueue } = await import('../queue/task-queue');
        taskQueue.enqueue(async () => {
            try {
                const lessons = await learningDb.findLessonsByCourseId(courseId, sessionId);
                const completedIds = await learningDb.findLessonCompletions(studentId, lessons.map(l => l.id), sessionId);
                const progress = lessons.length > 0 ? Math.round((completedIds.length / lessons.length) * 100) : 0;
                await learningDb.updateEnrollmentProgress(studentId, courseId, progress, sessionId);
            } catch (err) {
                console.error('[Consistency] Fatal progress sync failure:', err);
            }
        });
        throw error;
    }

    return { success: true };
  }

  async getLessonCompletions(studentId: string, sessionId: string): Promise<LessonCompletion[]> {
    return (await learningDb.getLessonCompletions(studentId, sessionId)) as LessonCompletion[];
  }
}

export const learningService = new LearningService();
