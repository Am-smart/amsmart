import { withSession, supabase } from '../supabase.server';
import { Assignment, Quiz, Submission, QuizSubmission } from '../types';
import { dbUtils, SAFE_USER_SELECT } from './db-utils.server';

// Never `users!student_id(*)`: that ships password hashes and reset tokens.
const STUDENT_EMBED = `users!student_id(${SAFE_USER_SELECT})`;

export const assessmentDb = {
  // Assignment Operations
  async findAssignmentById(id: string, sessionId: string): Promise<Assignment | null> {
    const { data, error } = await withSession(supabase.from('assignments').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as Assignment;
  },

  async findAllAssignments(teacherId?: string, courseId?: string, sessionId?: string, limit?: number, offset?: number): Promise<Assignment[]> {
    let query = withSession(supabase.from('assignments').select('*, courses!inner(*)'), sessionId);
    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (courseId) query = query.eq('course_id', courseId);

    query = query.order('due_date', { ascending: true, nullsFirst: false }).order('id', { ascending: true });
    query = dbUtils.applyPagination(query, { limit, offset });

    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Assignment[];
  },

  async upsertAssignment(assignment: Partial<Assignment>, sessionId: string): Promise<Assignment> {
    return dbUtils.upsert(supabase.from('assignments'), assignment, 'Assignment', sessionId, { excludeFields: ['courses', 'course'] }) as unknown as Promise<Assignment>;
  },

  async deleteAssignment(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('assignments'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Quiz Operations
  async findQuizById(id: string, sessionId: string): Promise<Quiz | null> {
    const { data, error } = await withSession(supabase.from('quizzes').select('*, courses(*)').eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as Quiz;
  },

  async findAllQuizzes(courseId?: string, teacherId?: string, sessionId?: string, limit?: number, offset?: number): Promise<Quiz[]> {
    let query = withSession(supabase.from('quizzes').select('*, courses(*)'), sessionId);
    if (courseId) query = query.eq('course_id', courseId);
    if (teacherId) query = query.eq('teacher_id', teacherId);

    query = query.order('created_at', { ascending: false }).order('id', { ascending: true });
    query = dbUtils.applyPagination(query, { limit, offset });

    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Quiz[];
  },

  async upsertQuiz(quiz: Partial<Quiz>, sessionId: string): Promise<Quiz> {
    return dbUtils.upsert(supabase.from('quizzes'), quiz, 'Quiz', sessionId, { excludeFields: ['courses', 'course'] }) as unknown as Promise<Quiz>;
  },

  async deleteQuiz(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('quizzes'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Submission Operations
  async findSubmissionById(id: string, sessionId: string): Promise<Submission | null> {
    const { data, error } = await withSession(supabase.from('submissions').select(`*, assignments(*), ${STUDENT_EMBED}`).eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as Submission;
  },

  async findAllSubmissions(assignmentId?: string, studentId?: string, sessionId?: string, limit?: number, offset?: number, teacherId?: string, status?: string, courseId?: string): Promise<Submission[]> {
    let query = withSession(supabase.from('submissions').select(`*, assignments!inner(*, courses(*)), ${STUDENT_EMBED}`), sessionId);
    if (assignmentId) query = query.eq('assignment_id', assignmentId);
    if (studentId) query = query.eq('student_id', studentId);
    if (teacherId) query = query.eq('assignments.teacher_id', teacherId);
    if (status) query = query.eq('status', status);
    if (courseId) query = query.eq('assignments.course_id', courseId);

    query = query.order('submitted_at', { ascending: false, nullsFirst: false }).order('id', { ascending: true });
    query = dbUtils.applyPagination(query, { limit, offset });

    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as Submission[];
  },

  /**
   * Submissions belonging to specific (assignment, group) pairs. Used so every
   * member of a group sees and works on the single shared group submission.
   */
  async findSubmissionsByGroups(
    keys: { assignmentId: string; groupId: string }[],
    sessionId: string,
  ): Promise<Submission[]> {
    const valid = keys.filter((k) => k.assignmentId && k.groupId);
    if (valid.length === 0) return [];

    const filter = valid
      .map((k) => `and(assignment_id.eq.${k.assignmentId},group_id.eq.${k.groupId})`)
      .join(',');

    const { data, error } = await withSession(
      supabase
        .from('submissions')
        .select(`*, assignments!inner(*, courses(*)), ${STUDENT_EMBED}`)
        .or(filter)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true }),
      sessionId,
    );
    if (error) dbUtils.handleError(error);
    return (data || []) as Submission[];
  },


  async upsertSubmission(submission: Partial<Submission>, sessionId: string): Promise<Submission> {
    return dbUtils.upsert(supabase.from('submissions'), submission, 'Submission', sessionId, {
      onConflict: 'assignment_id,student_id',
      excludeFields: ['assignments', 'assignment', 'users', 'student']
    }) as unknown as Promise<Submission>;
  },

  async deleteSubmission(id: string, sessionId: string): Promise<void> {
    const { error } = await withSession(supabase.from('submissions'), sessionId).delete().eq('id', id);
    if (error) dbUtils.handleError(error);
  },

  // Quiz Submission Operations
  async findQuizSubmissionById(id: string, sessionId: string): Promise<QuizSubmission | null> {
    const { data, error } = await withSession(supabase.from('quiz_submissions').select(`*, quizzes(*), ${STUDENT_EMBED}`).eq('id', id), sessionId).maybeSingle();
    if (error) dbUtils.handleError(error);
    return data as QuizSubmission;
  },

  async findAllQuizSubmissions(quizId?: string, studentId?: string, sessionId?: string, teacherId?: string, courseId?: string, options: { limit?: number; offset?: number } = {}): Promise<QuizSubmission[]> {
    let query = withSession(supabase.from('quiz_submissions').select(`*, quizzes!inner(*), ${STUDENT_EMBED}`), sessionId);
    if (quizId) query = query.eq('quiz_id', quizId);
    if (studentId) query = query.eq('student_id', studentId);
    if (teacherId) query = query.eq('quizzes.teacher_id', teacherId);
    if (courseId) query = query.eq('quizzes.course_id', courseId);
    query = query.order('submitted_at', { ascending: false, nullsFirst: false }).order('id', { ascending: true });
    query = dbUtils.applyPagination(query, options);
    const { data, error } = await query;
    if (error) dbUtils.handleError(error);
    return data as QuizSubmission[];
  },

  async insertQuizSubmission(submission: Partial<QuizSubmission>, sessionId: string): Promise<QuizSubmission> {
    const { quizzes: _quizzes, quiz: _quiz, users: _users, student: _student, ...submissionData } = submission as Record<string, unknown>;
    const { data, error } = await withSession(supabase.from('quiz_submissions'), sessionId)
      .insert(submissionData)
      .select()
      .single();
    if (error) dbUtils.handleError(error);
    return data as QuizSubmission;
  },

  async upsertQuizSubmission(submission: Partial<QuizSubmission>, sessionId: string): Promise<QuizSubmission> {
    return dbUtils.upsert(supabase.from('quiz_submissions'), submission, 'Quiz submission', sessionId, {
      onConflict: 'quiz_id,student_id,attempt_number',
      excludeFields: ['quizzes', 'quiz', 'users', 'student']
    }) as unknown as Promise<QuizSubmission>;
  },

  async findQuizAttempts(quizId: string, studentId: string, sessionId: string): Promise<QuizSubmission[]> {
    const { data, error } = await withSession(supabase.from('quiz_submissions'), sessionId)
      .select('attempt_number')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .order('attempt_number', { ascending: false });
    if (error) dbUtils.handleError(error);
    return data as QuizSubmission[];
  }
};
