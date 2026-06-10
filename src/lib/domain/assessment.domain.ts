import { Assignment, Quiz, QuizQuestion, QuizSubmission, Submission } from '../types';
import { ASSESSMENT_STATUS, SUBMISSION_STATUS } from '../constants';

export class AssessmentDomain {
  /**
   * Centralized sanitizer to remove joined relation objects before persistence.
   * Prevents PostgREST errors during upsert/insert.
   */
  static sanitizeEntity<T>(entity: T): T {
    if (!entity || typeof entity !== 'object') return entity;
    const {
        courses: _c,
        course: _c2,
        users: _u,
        student: _s,
        assignments: _a,
        assignment: _a2,
        quizzes: _q,
        quiz: _q2,
        ...rest
    } = entity as Record<string, unknown>;
    return rest as T;
  }

  static validateSubmission(submission: Partial<Submission>) {
    if (!submission.submission_text && !submission.file_url) {
      throw new Error('Submission must include either text or a file');
    }
  }

  static validateAssignment(assignment: Partial<Assignment>) {
    if (!assignment.title || assignment.title.trim().length === 0) {
        throw new Error('Assignment title is required');
    }
    if (!assignment.course_id) {
        throw new Error('Course ID is required');
    }
    if (assignment.start_at && assignment.due_date && new Date(assignment.start_at) >= new Date(assignment.due_date)) {
        throw new Error('Start date must be before due date');
    }
    if (assignment.questions) {
        if (assignment.questions.length === 0) {
            throw new Error('Assignment must have at least one question or task step');
        }
        let totalPoints = 0;
        assignment.questions.forEach((q, idx) => {
            if (!q.text || q.text.trim().length === 0) {
                throw new Error(`Question ${idx + 1} text is required`);
            }
            if (!['essay', 'file', 'link'].includes(q.type)) {
                throw new Error(`Invalid type for assignment question ${idx + 1}`);
            }
            totalPoints += q.points || 0;
        });

        if (assignment.points_possible !== undefined && totalPoints !== assignment.points_possible) {
            throw new Error(`Total question points (${totalPoints}) must match points possible (${assignment.points_possible})`);
        }
    }
  }

  static validateQuiz(quiz: Partial<Quiz>) {
    if (!quiz.title || quiz.title.trim().length === 0) {
        throw new Error('Quiz title is required');
    }
    if (!quiz.course_id) {
        throw new Error('Course ID is required');
    }
    if (quiz.start_at && quiz.end_at && new Date(quiz.start_at) > new Date(quiz.end_at)) {
        throw new Error('Start date cannot be after end date');
    }
    if (quiz.questions) {
        if (quiz.questions.length === 0) {
            throw new Error('Quiz must have at least one question');
        }
        let totalPoints = 0;
        quiz.questions.forEach((q, idx) => {
            if (!q.text || q.text.trim().length === 0) {
                throw new Error(`Question ${idx + 1} text is required`);
            }
            if (!['mcq', 'tf', 'short'].includes(q.type)) {
                throw new Error(`Invalid type for quiz question ${idx + 1}`);
            }
            if (q.points !== undefined && q.points < 0) {
                throw new Error(`Points for question ${idx + 1} cannot be negative`);
            }
            totalPoints += q.points || 0;
        });
        if (totalPoints <= 0) {
            throw new Error('Total quiz points must be greater than zero');
        }
    }
    if (quiz.time_limit !== undefined && quiz.time_limit < 0) {
        throw new Error('Time limit cannot be negative');
    }
    if (quiz.passing_score !== undefined && (quiz.passing_score < 0 || quiz.passing_score > 100)) {
        throw new Error('Passing score must be between 0 and 100');
    }
  }

  static calculateQuizScore(questions: QuizQuestion[], answers: Record<string, unknown>) {
    if (!questions || questions.length === 0) return { score: 0, totalPoints: 0, correctCount: 0 };

    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((q) => {
        const points = q.points || 0;
        totalPoints += points;

        const userAnswer = answers[q.id];
        // Ensure comparison handles both string and number for all types
        // Normalize (trim and lowercase) for short answer as requested
        if (userAnswer !== undefined) {
            const isMatch = q.type === 'short'
                ? String(userAnswer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
                : String(userAnswer).toLowerCase() === String(q.correct_answer).toLowerCase();

            if (isMatch) {
                correctCount++;
                earnedPoints += points;
            }
        }
    });

    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return {
        score: scorePercentage,
        earnedPoints,
        totalPoints,
        correctCount
    };
  }

  static validateQuizAttempt(quiz: Quiz, currentAttempts: number): void {
    if (quiz.attempts_allowed > 0 && currentAttempts >= quiz.attempts_allowed) {
      throw new Error(`Maximum attempts (${quiz.attempts_allowed}) reached for this quiz.`);
    }
  }

  /**
   * Validates assignment grading data.
   */
  static validateGrading(submission: unknown, gradeData: Partial<Submission>) {
    const sub = submission as Record<string, unknown>;
    const assignment = (sub?.assignment || sub?.assignments) as Record<string, unknown>;
    if (!assignment) return; // Cannot validate without assignment context

    const questions = assignment.questions as { id: string; text: string; points: number }[];
    if (gradeData.question_scores && questions) {
        let calculatedTotal = 0;
        questions.forEach((q) => {
            const score = gradeData.question_scores?.[q.id];
            if (score !== undefined) {
                if (score < 0) {
                    throw new Error(`Score for question "${q.text}" cannot be negative.`);
                }
                if (score > q.points) {
                    throw new Error(`Score for question "${q.text}" (${score}) exceeds maximum points (${q.points}).`);
                }
                calculatedTotal += score;
            }
        });

        if (gradeData.grade !== undefined && Math.abs(Number(gradeData.grade) - calculatedTotal) > 0.01) {
            throw new Error(`Total grade (${gradeData.grade}) does not match the sum of question scores (${calculatedTotal}).`);
        }
    }
  }

  static prepareAssignment(assignment: Partial<Assignment>, teacherId: string): Partial<Assignment> {
    this.validateAssignment(assignment);
    const rest = this.sanitizeEntity(assignment);
    return {
      ...rest,
      teacher_id: assignment.teacher_id || teacherId,
      status: assignment.status || ASSESSMENT_STATUS.DRAFT,
      allowed_extensions: assignment.allowed_extensions || ['pdf', 'doc', 'docx', 'zip', 'jpg', 'png']
    };
  }

  static prepareQuiz(quiz: Partial<Quiz>, teacherId: string): Partial<Quiz> {
    this.validateQuiz(quiz);
    const rest = this.sanitizeEntity(quiz);
    return {
      ...rest,
      teacher_id: quiz.teacher_id || teacherId,
      status: quiz.status || ASSESSMENT_STATUS.DRAFT,
      shuffle_questions: quiz.shuffle_questions || false
    };
  }

  static prepareSubmission(studentId: string, assignmentId: string, content: Partial<Submission>): Partial<Submission> {
    const rest = this.sanitizeEntity(content);
    return {
      ...rest,
      assignment_id: assignmentId,
      student_id: studentId,
      submitted_at: new Date().toISOString(),
      status: SUBMISSION_STATUS.SUBMITTED
    };
  }

  static prepareQuizSubmission(studentId: string, quizId: string, attemptNumber: number, score: number, totalPoints: number, submissionData: Partial<QuizSubmission>): Partial<QuizSubmission> {
    return {
      quiz_id: quizId,
      student_id: studentId,
      attempt_number: attemptNumber,
      answers: submissionData.answers || {},
      score: score,
      total_points: totalPoints,
      status: SUBMISSION_STATUS.SUBMITTED,
      submitted_at: new Date().toISOString(),
      time_spent: submissionData.time_spent || 0,
      violation_count: submissionData.violation_count || 0,
      started_at: submissionData.started_at || new Date().toISOString()
    };
  }
}
