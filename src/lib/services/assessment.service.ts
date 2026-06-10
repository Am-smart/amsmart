import { assessmentDb } from '../database/assessment.db';
import { Assignment, Quiz, Submission, QuizSubmission, QuizQuestion, User } from '../types';
import { AssessmentDomain } from '../domain/assessment.domain';
import { SUBMISSION_STATUS } from '../constants';
import { NotFoundError, ForbiddenError } from '../api-error';

export class AssessmentService {
  // Assignments
  async getAssignments(teacherId?: string, courseId?: string, sessionId?: string, limit?: number, offset?: number, userId?: string, userRole?: string): Promise<Assignment[]> {
    if (userRole === 'student' && userId) {
        const { serviceRegistry } = await import('./service-registry');
        const enrollments = await serviceRegistry.systemService.getStudentEnrollments(userId, sessionId!);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const assignments = await assessmentDb.findAllAssignments(teacherId, courseId, sessionId!, limit, offset);
        const now = new Date();
        return assignments.filter(a =>
            enrolledCourseIds.includes(a.course_id) &&
            (!a.start_at || new Date(a.start_at) <= now)
        );
    }
    return assessmentDb.findAllAssignments(teacherId, courseId, sessionId!, limit, offset);
  }

  async saveAssignment(teacherId: string, assignment: Partial<Assignment>, sessionId: string, currentUser?: User): Promise<Assignment> {
    let existing: Assignment | null = null;
    if (currentUser && currentUser.role === 'teacher') {
        let courseId = assignment.course_id;

        if (!courseId && assignment.id) {
            existing = await assessmentDb.findAssignmentById(assignment.id, sessionId);
            if (existing) {
                courseId = existing.course_id;
            }
        }

        if (!courseId) throw new Error('Course ID is required');

        const { serviceRegistry } = await import('./service-registry');
        const course = await serviceRegistry.learningService.getCourse(courseId, sessionId);
        if (course.teacher_id !== currentUser.id) {
            throw new ForbiddenError('Unauthorized: You can only manage assignments for your own courses');
        }
    } else if (assignment.id) {
        existing = await assessmentDb.findAssignmentById(assignment.id, sessionId);
    }

    const assignmentToSave = AssessmentDomain.prepareAssignment(assignment, teacherId);
    const saved = await assessmentDb.upsertAssignment(assignmentToSave, sessionId);

    // Trigger Notification (Migrated from tr_assignment_published)
    if (saved.status === 'published' && (!existing || existing.status !== 'published')) {
        const { serviceRegistry } = await import('./service-registry');
        await serviceRegistry.systemService.createBroadcast({
            course_id: saved.course_id,
            target_role: 'student',
            title: 'New Assignment',
            message: `A new assignment "${saved.title}" has been published.`,
            link: `assignment-list:${saved.id}`,
            type: 'assignment_published',
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }, sessionId);
    }

    return saved;
  }

  async deleteAssignment(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'teacher') {
        const assignment = await assessmentDb.findAssignmentById(id, sessionId);
        if (assignment) {
            const { serviceRegistry } = await import('./service-registry');
            const course = await serviceRegistry.learningService.getCourse(assignment.course_id, sessionId);
            if (course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage assignments for your own courses');
            }
        }
    }
    await assessmentDb.deleteAssignment(id, sessionId);
  }

  // Quizzes
  /**
   * Internal helper to shuffle quiz questions if enabled.
   * Uses a stable seed (userId + quizId) for students to ensure consistent order within a session/day,
   * but still shuffled across different users.
   */
  private shuffleQuizQuestions(quiz: Quiz, userId?: string): Quiz {
    if (quiz.shuffle_questions && quiz.questions && Array.isArray(quiz.questions)) {
        const questions = [...quiz.questions];
        if (questions.length <= 1) return quiz;

        // Create a simple deterministic "random" sequence using user+quiz seed
        const seedStr = `${userId || 'anon'}-${quiz.id}`;
        let seed = 0;
        for (let i = 0; i < seedStr.length; i++) {
            seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
            seed |= 0;
        }

        // Simple LCG (Linear Congruential Generator) for stable "randomness"
        const lcg = () => {
            seed = (seed * 1664525 + 1013904223) | 0;
            return (seed >>> 0) / 4294967296;
        };

        // Fisher-Yates with stable seed
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(lcg() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        return { ...quiz, questions };
    }
    return quiz;
  }

  async getQuizzes(courseId?: string, teacherId?: string, sessionId?: string, limit?: number, offset?: number, userId?: string, userRole?: string): Promise<Quiz[]> {
    if (userRole === 'student' && userId) {
        const { serviceRegistry } = await import('./service-registry');
        const enrollments = await serviceRegistry.systemService.getStudentEnrollments(userId, sessionId!);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const quizzes = await assessmentDb.findAllQuizzes(courseId, teacherId, sessionId!, limit, offset);
        const filtered = quizzes.filter(q => enrolledCourseIds.includes(q.course_id));

        // Stable Server-side Shuffling for Students
        return filtered.map(q => this.shuffleQuizQuestions(q, userId));
    }
    return assessmentDb.findAllQuizzes(courseId, teacherId, sessionId!, limit, offset);
  }

  async getQuiz(id: string, sessionId: string, userId?: string, userRole?: string): Promise<Quiz> {
    const quiz = await assessmentDb.findQuizById(id, sessionId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    if (userRole === 'student' && userId) {
        const { serviceRegistry } = await import('./service-registry');
        const enrolled = await serviceRegistry.systemService.isEnrolled(quiz.course_id, userId, sessionId);
        if (!enrolled) throw new ForbiddenError('You are not enrolled in this course');
        return this.shuffleQuizQuestions(quiz, userId);
    }
    return quiz;
  }

  async saveQuiz(teacherId: string, quiz: Partial<Quiz>, sessionId: string, currentUser?: User): Promise<Quiz> {
    let existing: Quiz | null = null;
    if (currentUser && currentUser.role === 'teacher') {
        let courseId = quiz.course_id;

        if (!courseId && quiz.id) {
            existing = await assessmentDb.findQuizById(quiz.id, sessionId);
            if (existing) {
                courseId = existing.course_id;
            }
        }

        if (!courseId) throw new Error('Course ID is required');

        const { serviceRegistry } = await import('./service-registry');
        const course = await serviceRegistry.learningService.getCourse(courseId, sessionId);
        if (course.teacher_id !== currentUser.id) {
            throw new ForbiddenError('Unauthorized: You can only manage quizzes for your own courses');
        }
    } else if (quiz.id) {
        existing = await assessmentDb.findQuizById(quiz.id, sessionId);
    }

    const quizToSave = AssessmentDomain.prepareQuiz(quiz, teacherId);
    const saved = await assessmentDb.upsertQuiz(quizToSave, sessionId);

    // Trigger Notification (Migrated from tr_quiz_published)
    if (saved.status === 'published' && (!existing || existing.status !== 'published')) {
        const { serviceRegistry } = await import('./service-registry');
        await serviceRegistry.systemService.createBroadcast({
            course_id: saved.course_id,
            target_role: 'student',
            title: 'New Quiz Available',
            message: `A new quiz "${saved.title}" has been published.`,
            link: `quiz-list:${saved.id}`,
            type: 'quiz_published',
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        }, sessionId);
    }

    return saved;
  }

  async deleteQuiz(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'teacher') {
        const quiz = await assessmentDb.findQuizById(id, sessionId);
        if (quiz) {
            const { serviceRegistry } = await import('./service-registry');
            const course = await serviceRegistry.learningService.getCourse(quiz.course_id, sessionId);
            if (course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage quizzes for your own courses');
            }
        }
    }
    await assessmentDb.deleteQuiz(id, sessionId);
  }

  // Submissions
  async getSubmissions(assignmentId?: string, studentId?: string, sessionId?: string, limit?: number, offset?: number, userId?: string, userRole?: string, status?: string, courseId?: string): Promise<Submission[]> {
    if (userRole === 'student' && userId) {
        // Students can only see their own submissions
        return assessmentDb.findAllSubmissions(assignmentId, userId, sessionId!, limit, offset, undefined, status, courseId);
    }

    if (userRole === 'teacher' && userId) {
        // Teachers can only see submissions for assignments they own
        return assessmentDb.findAllSubmissions(assignmentId, studentId, sessionId!, limit, offset, userId, status, courseId);
    }

    return assessmentDb.findAllSubmissions(assignmentId, studentId, sessionId!, limit, offset, undefined, status, courseId);
  }

  async submitAssignment(studentId: string, assignmentId: string, content: Partial<Submission>, sessionId: string): Promise<Submission> {
    // Idempotency: Check if already submitted
    const existing = await assessmentDb.findAllSubmissions(assignmentId, studentId, sessionId);
    if (existing.length > 0 && existing[0].status !== SUBMISSION_STATUS.DRAFT) {
        return existing[0];
    }

    const assignment = await assessmentDb.findAssignmentById(assignmentId, sessionId);
    if (!assignment) throw new NotFoundError('Assignment not found');

    const submissionToSave = AssessmentDomain.prepareSubmission(studentId, assignmentId, content);

    // Calculate late penalty
    const submittedAt = new Date(submissionToSave.submitted_at!);
    const dueDate = new Date(assignment.due_date);

    if (submittedAt > dueDate) {
        if (!assignment.allow_late_submissions) {
            throw new Error('Late submissions are not allowed for this assignment.');
        }
        const diffMs = submittedAt.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const penaltyPerDay = assignment.late_penalty_per_day || 0;
        submissionToSave.late_penalty_applied = diffDays * penaltyPerDay;
    }

    return assessmentDb.upsertSubmission(submissionToSave, sessionId);
  }

  async gradeSubmission(submissionId: string, gradeData: Partial<Submission>, sessionId: string, performingUserId?: string, performingUserRole?: string): Promise<Submission> {
    // Backend Grade Protection: Ensure students cannot modify grades
    if (performingUserRole === 'student') {
        throw new ForbiddenError('Students are not authorized to modify grades');
    }

    const submission = await assessmentDb.findSubmissionById(submissionId, sessionId);
    if (!submission) throw new NotFoundError('Submission not found');

    // Prevent re-grading if already graded with same score to ensure atomicity and avoid redundant notifications
    if (submission.status === SUBMISSION_STATUS.GRADED && submission.grade === gradeData.grade && !gradeData.feedback) {
        return submission;
    }

    // Authorization check: Teachers can only grade submissions for their own assignments
    if (performingUserRole === 'teacher' && performingUserId) {
        let teacherId = submission.assignments?.teacher_id;

        if (!teacherId) {
            const assignment = await assessmentDb.findAssignmentById(submission.assignment_id, sessionId);
            teacherId = assignment?.teacher_id;
        }

        if (teacherId !== performingUserId) {
            throw new ForbiddenError('You are not authorized to grade this submission');
        }
    }

    // Backend Validation
    AssessmentDomain.validateGrading(submission, gradeData);

    // Backend-owned Late Penalty & Grade Calculation
    const subAny = submission as any;
    const assignment = subAny.assignments || subAny.assignment;
    let latePenaltyApplied = 0;
    if (assignment && assignment.due_date && submission.submitted_at) {
        const submittedAt = new Date(submission.submitted_at);
        const dueDate = new Date(assignment.due_date);
        if (submittedAt > dueDate) {
            const daysLate = Math.floor((submittedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            latePenaltyApplied = daysLate * (assignment.late_penalty_per_day || 0);
        }
    }

    const rawGrade = gradeData.question_scores
        ? Object.values(gradeData.question_scores).reduce((a, b) => a + b, 0)
        : (gradeData.grade ?? submission.grade ?? 0);

    const pointsPossible = assignment?.points_possible || 100;
    const rawPercentage = Math.round((rawGrade / pointsPossible) * 100);
    const finalGrade = Math.max(0, rawPercentage - latePenaltyApplied);

    const sanitized = AssessmentDomain.sanitizeEntity(gradeData);
    const { assignments: _assignments, users: _users, ...rest } = sanitized as Record<string, unknown>;

    const updated = await assessmentDb.upsertSubmission({
      ...rest,
      id: submissionId,
      grade: rawGrade,
      late_penalty_applied: latePenaltyApplied,
      final_grade: finalGrade,
      status: SUBMISSION_STATUS.GRADED,
      graded_at: new Date().toISOString(),
    } as Partial<Submission>, sessionId);

    // Trigger Notification (Migrated from tr_submission_graded)
    if (submission.status !== SUBMISSION_STATUS.GRADED) {
        const { serviceRegistry } = await import('./service-registry');
        await serviceRegistry.systemService.notifyUser({
            target_id: updated.student_id,
            n_title: 'Assignment Graded',
            n_msg: 'Your submission for an assignment has been graded.',
            n_link: `assignment-list:${updated.assignment_id}`,
            n_type: 'grading'
        }, sessionId);
    }

    return updated;
  }

  // Quiz Submissions
  async getQuizSubmissions(quizId?: string, studentId?: string, sessionId?: string, userId?: string, userRole?: string, courseId?: string, options: { limit?: number; offset?: number } = {}): Promise<QuizSubmission[]> {
    if (userRole === 'student' && userId) {
        return assessmentDb.findAllQuizSubmissions(quizId, userId, sessionId!, undefined, courseId, options);
    }

    if (userRole === 'teacher' && userId) {
        return assessmentDb.findAllQuizSubmissions(quizId, studentId, sessionId!, userId, courseId, options);
    }

    return assessmentDb.findAllQuizSubmissions(quizId, studentId, sessionId!, undefined, courseId, options);
  }

  async findQuizAttempts(quizId: string, studentId: string, sessionId: string): Promise<QuizSubmission[]> {
    return assessmentDb.findQuizAttempts(quizId, studentId, sessionId);
  }

  async saveQuizProgress(studentId: string, quizId: string, submissionData: Partial<QuizSubmission>, sessionId: string): Promise<QuizSubmission> {
    const quiz = await assessmentDb.findQuizById(quizId, sessionId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    // Ensure we don't use shuffled questions for grading if we fetched them shuffled
    // but AssessmentDomain.calculateQuizScore works with question IDs so it should be fine.

    const existingSubmissions = await assessmentDb.findQuizAttempts(quizId, studentId, sessionId);
    const attemptNumber = existingSubmissions.length > 0 ? (existingSubmissions[0].attempt_number || 1) : 1;

    const submissionToSave: Partial<QuizSubmission> = {
      ...submissionData,
      quiz_id: quizId,
      student_id: studentId,
      attempt_number: attemptNumber,
      status: SUBMISSION_STATUS.IN_PROGRESS,
      updated_at: new Date().toISOString()
    };

    return assessmentDb.upsertQuizSubmission(submissionToSave, sessionId);
  }

  async submitQuiz(studentId: string, quizId: string, submissionData: Partial<QuizSubmission>, sessionId: string): Promise<{ success: boolean, score: number }> {
    const quiz = await assessmentDb.findQuizById(quizId, sessionId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    const existingSubmissions = await assessmentDb.findQuizAttempts(quizId, studentId, sessionId);

    // Idempotency check: prevent duplicate submission for the same started_at timestamp
    if (submissionData.started_at) {
        const duplicate = (await assessmentDb.findAllQuizSubmissions(quizId, studentId, sessionId))
            .find(s => s.started_at === submissionData.started_at && s.status === 'submitted');
        if (duplicate) {
            return { success: true, score: duplicate.score || 0 };
        }
    }

    const currentAttempts = existingSubmissions.length;

    AssessmentDomain.validateQuizAttempt(quiz, currentAttempts);

    const nextAttempt = currentAttempts + 1;
    const answers = (submissionData.answers as Record<string, string>) || {};
    const questions = (quiz.questions as QuizQuestion[]) || [];

    const { score: calculatedScore, totalPoints } = AssessmentDomain.calculateQuizScore(questions, answers);

    const submissionToSave = AssessmentDomain.prepareQuizSubmission(
      studentId,
      quizId,
      nextAttempt,
      calculatedScore,
      totalPoints,
      submissionData
    );

    await assessmentDb.insertQuizSubmission(submissionToSave, sessionId);

    return { success: true, score: calculatedScore };
  }
}

export const assessmentService = new AssessmentService();
