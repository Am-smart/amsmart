import { withSession, supabase } from '../supabase';
import { Course, Lesson, Material, Enrollment } from '../types';
import { dbUtils } from './db-utils';

export const learningDb = {
  // Course Operations
  async findCourseById(id: string, sessionId?: string): Promise<Course | null> {
    const query = withSession(supabase.from('courses').select('*').eq('id', id), sessionId);
    const { data, error } = await query.maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as Course;
  },

  async findAllCourses(teacherId?: string, sessionId?: string, limit?: number, offset?: number): Promise<Course[]> {
    let query = withSession(supabase.from('courses').select('*'), sessionId);
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    } else {
      query = query.eq('status', 'published');
    }

    query = dbUtils.applyPagination(query, { limit, offset });

    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Course[];
  },

  async upsertCourse(course: Partial<Course>, sessionId: string): Promise<Course> {
    return dbUtils.upsert(supabase.from('courses'), course, 'Course', sessionId, { excludeFields: ['teacher', 'enrollments', 'users'] }) as unknown as Promise<Course>;
  },

  async deleteCourse(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('courses'), sessionId)
      .delete()
      .eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Lesson Operations
  async findLessonById(id: string, sessionId: string): Promise<Lesson | null> {
    const { data, error } = await withSession(supabase.from('lessons').select('*').eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as Lesson;
  },

  async findLessonsByCourseId(courseId: string, sessionId: string): Promise<Lesson[]> {
    const { data, error } = await withSession(supabase.from('lessons'), sessionId)
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    if (error) dbUtils.handleError(error);
    return data as Lesson[];
  },

  async upsertLesson(lesson: Partial<Lesson>, sessionId: string): Promise<Lesson> {
    return dbUtils.upsert(supabase.from('lessons'), lesson, 'Lesson', sessionId) as unknown as Promise<Lesson>;
  },

  async deleteLesson(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('lessons'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  async markLessonComplete(studentId: string, lessonId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('lesson_completions'), sessionId)
      .upsert({
        student_id: studentId,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_id,lesson_id' });
    if (error) dbUtils.handleError(error);
  },

  async findLessonCompletions(studentId: string, lessonIds: string[], sessionId: string): Promise<string[]> {
    const { data, error } = await withSession(supabase.from('lesson_completions'), sessionId)
        .select('lesson_id')
        .eq('student_id', studentId)
        .in('lesson_id', lessonIds);
    if (error) dbUtils.handleError(error);
    return data?.map(c => c.lesson_id) || [];
  },

  async getLessonCompletions(studentId: string, sessionId: string): Promise<unknown[]> {
    const { data, error } = await withSession(supabase.from('lesson_completions').select('*').eq('student_id', studentId), sessionId);
    if (error) dbUtils.handleError(error);
    return data || [];
  },

  // Material Operations
  async findMaterialById(id: string, sessionId: string): Promise<Material | null> {
    const { data, error } = await withSession(supabase.from('materials').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as Material;
  },

  async findAllMaterials(courseId?: string, sessionId?: string, teacherId?: string, options: { limit?: number; offset?: number } = {}): Promise<Material[]> {
    let query = withSession(supabase.from('materials').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('courses.teacher_id', teacherId);
    query = dbUtils.applyPagination(query, options);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Material[];
  },

  async upsertMaterial(material: Partial<Material>, sessionId: string): Promise<Material> {
    return dbUtils.upsert(supabase.from('materials'), material, 'Material', sessionId, { excludeFields: ['courses', 'course'] }) as unknown as Promise<Material>;
  },

  async deleteMaterial(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('materials'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Enrollment Operations
  async findEnrollmentsByStudentId(studentId: string, sessionId: string): Promise<Enrollment[]> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*, courses(*), users!student_id(*)')
      .eq('student_id', studentId);
    if (error) dbUtils.handleError(error);
    return data as Enrollment[];
  },

  async findEnrollmentsByCourseIds(courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*, courses(*), users!student_id(*)')
      .in('course_id', courseIds);
    if (error) dbUtils.handleError(error);
    return data as Enrollment[];
  },

  async findEnrollmentByCourseAndStudent(courseId: string, studentId: string, sessionId: string): Promise<Enrollment | null> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as Enrollment;
  },

  async upsertEnrollment(enrollment: Partial<Enrollment>, sessionId: string): Promise<Enrollment> {
    const { data, error } = await withSession(supabase.from('enrollments'), sessionId)
      .upsert(enrollment, { onConflict: 'course_id,student_id' })
      .select()
      .single();
    if (error) dbUtils.handleError(error);
    return data as Enrollment;
  },

  async updateEnrollmentProgress(studentId: string, courseId: string, progress: number, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('enrollments'), sessionId)
      .update({ progress, completed: progress === 100 })
      .eq('course_id', courseId)
      .eq('student_id', studentId);
    if (error) dbUtils.handleError(error);
  },

  async deleteEnrollment(courseId: string, studentId: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('enrollments'), sessionId)
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId);
    if (error) dbUtils.handleError(error);
  },

  async countEnrollmentsByCourseId(courseId: string, sessionId: string): Promise<number> {
    const { count, error } = await withSession(supabase.from('enrollments'), sessionId)
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);
    if (error) dbUtils.handleError(error);
    return count || 0;
  }
};
