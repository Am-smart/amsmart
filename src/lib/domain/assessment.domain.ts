import { Assignment, AssignmentGroup, Quiz, QuizQuestion, QuizSubmission, Submission } from '../types';
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
    if (!submission.submission_text && !submission.file_url && (!submission.answers || Object.keys(submission.answers).length === 0)) {
      throw new Error('Submission must include either text, a file, or at least one answer');
    }
  }

  /**
   * Validates that each answer's mode matches the question's allowed types.
   * Used server-side to enforce submission mode constraints.
   */
  static validateAnswerModes(answers: Record<string, any>, questions: { id: string; type?: string; types?: string[] }[]): void {
    const allowedModes = new Set<string>(['essay', 'file', 'link']);

    for (const question of questions) {
      const answer = answers[question.id];
      if (!answer) continue;

      // If answer is already in {mode, value} shape, validate the mode
      if (answer && typeof answer === 'object' && 'mode' in answer && 'value' in answer) {
        const questionModes = (question.types && question.types.length > 0) ? question.types : (question.type ? [question.type] : ['essay']);
        const validModes = questionModes.filter((m): m is 'essay' | 'file' | 'link' => allowedModes.has(m));
        
        if (!validModes.includes(answer.mode)) {
          throw new Error(`Invalid submission mode "${answer.mode}" for question "${question.id}". Allowed: ${validModes.join(', ')}`);
        }
      }
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
            const allowedModes: Array<'essay' | 'file' | 'link'> = ['essay', 'file', 'link'];
            const modes = (q.types && q.types.length > 0) ? q.types : (q.type ? [q.type] : []);
            if (modes.length === 0) {
                throw new Error(`Question ${idx + 1} must allow at least one submission type`);
            }
            if (modes.some((m) => !allowedModes.includes(m))) {
                throw new Error(`Invalid submission type for question ${idx + 1}`);
            }
            totalPoints += q.points || 0;
        });

        if (assignment.points_possible !== undefined && totalPoints !== assignment.points_possible) {
            throw new Error(`Total question points (${totalPoints}) must match points possible (${assignment.points_possible})`);
        }
    }
    if (assignment.assignment_type === 'group') {
        this.validateGroups(assignment.groups);
    }
  }

  // ---------------------------------------------------------------------------
  // Group assignments
  // ---------------------------------------------------------------------------

  /** True when the assignment is delivered to groups instead of individuals. */
  static isGroupAssignment(assignment?: Partial<Assignment> | null): boolean {
    return assignment?.assignment_type === 'group';
  }

  static normalizeGroups(groups?: unknown): AssignmentGroup[] {
    if (!Array.isArray(groups)) return [];
    return groups
      .filter((g): g is Record<string, any> => !!g && typeof g === 'object')
      .map((g) => ({
        id: String(g.id || '').trim(),
        name: String(g.name || '').trim(),
        member_ids: Array.isArray(g.member_ids) ? g.member_ids.map((m: unknown) => String(m)).filter(Boolean) : [],
        leader_id: g.leader_id ? String(g.leader_id) : null,
      }));
  }

  /**
   * Groups must be uniquely named/identified, non-empty, and a student may only
   * belong to a single group per assignment. A leader, when set, must be a member.
   */
  static validateGroups(groups?: unknown) {
    const list = this.normalizeGroups(groups);
    if (list.length === 0) {
      throw new Error('A group assignment must define at least one group');
    }
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    const seenMembers = new Map<string, string>();

    list.forEach((group, idx) => {
      if (!group.id) throw new Error(`Group ${idx + 1} is missing an identifier`);
      if (!group.name) throw new Error(`Group ${idx + 1} needs a name`);
      if (seenIds.has(group.id)) throw new Error(`Duplicate group identifier "${group.id}"`);
      const nameKey = group.name.toLowerCase();
      if (seenNames.has(nameKey)) throw new Error(`Duplicate group name "${group.name}"`);
      seenIds.add(group.id);
      seenNames.add(nameKey);

      if (group.member_ids.length === 0) {
        throw new Error(`Group "${group.name}" must have at least one member`);
      }
      const unique = new Set(group.member_ids);
      if (unique.size !== group.member_ids.length) {
        throw new Error(`Group "${group.name}" lists the same student more than once`);
      }
      group.member_ids.forEach((memberId) => {
        const other = seenMembers.get(memberId);
        if (other) {
          throw new Error(`A student cannot belong to both "${other}" and "${group.name}"`);
        }
        seenMembers.set(memberId, group.name);
      });
      if (group.leader_id && !group.member_ids.includes(group.leader_id)) {
        throw new Error(`The leader of "${group.name}" must also be a member of the group`);
      }
    });
  }

  /** The group a student belongs to on this assignment, if any. */
  static findGroupForStudent(
    assignment: Partial<Assignment> | null | undefined,
    studentId: string,
  ): AssignmentGroup | null {
    if (!assignment || !studentId) return null;
    const groups = this.normalizeGroups(assignment.groups);
    return groups.find((g) => g.member_ids.includes(studentId)) || null;
  }

  static findGroupById(
    assignment: Partial<Assignment> | null | undefined,
    groupId?: string | null,
  ): AssignmentGroup | null {
    if (!assignment || !groupId) return null;
    return this.normalizeGroups(assignment.groups).find((g) => g.id === groupId) || null;
  }

  /**
   * Whether a student may see/work on an assignment. Individual assignments are
   * open to every enrolled student; group assignments only to group members.
   */
  static canStudentAccessAssignment(
    assignment: Partial<Assignment> | null | undefined,
    studentId: string,
  ): boolean {
    if (!assignment) return false;
    if (!this.isGroupAssignment(assignment)) return true;
    return !!this.findGroupForStudent(assignment, studentId);
  }

  /**
   * Who may raise a regrade request. For group work this is the leader only
   * (falling back to any member when no leader was designated).
   */
  static canRequestRegrade(
    assignment: Partial<Assignment> | null | undefined,
    studentId: string,
  ): boolean {
    if (!assignment) return false;
    if (!this.isGroupAssignment(assignment)) return true;
    const group = this.findGroupForStudent(assignment, studentId);
    if (!group) return false;
    return group.leader_id ? group.leader_id === studentId : true;
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
        const questionScoresMap = gradeData.question_scores || {};
        
        // Validate each question score independently
        questions.forEach((q) => {
            const score = questionScoresMap[q.id];
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

        // If grade is provided, validate it matches the calculated total
        // If grade is not provided, backend will calculate it from question_scores
        if (gradeData.grade !== undefined && Math.abs(Number(gradeData.grade) - calculatedTotal) > 0.01) {
            throw new Error(`Total grade (${gradeData.grade}) does not match the sum of question scores (${calculatedTotal}).`);
        }
    }
  }

  static prepareAssignment(assignment: Partial<Assignment>, teacherId: string): Partial<Assignment> {
    this.validateAssignment(assignment);
    const rest = this.sanitizeEntity(assignment);
    const isGroup = assignment.assignment_type === 'group';
    return {
      ...rest,
      teacher_id: assignment.teacher_id || teacherId,
      status: assignment.status || ASSESSMENT_STATUS.DRAFT,
      assignment_type: isGroup ? 'group' : 'individual',
      groups: isGroup ? this.normalizeGroups(assignment.groups) : [],
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
    
    // Normalize answers to ensure consistent {mode, value} shape
    const normalizedAnswers: Record<string, any> = {};
    if (rest.answers && typeof rest.answers === 'object') {
        Object.entries(rest.answers).forEach(([key, answer]) => {
            if (answer && typeof answer === 'object' && 'mode' in answer && 'value' in answer) {
                // Already in {mode, value} shape
                normalizedAnswers[key] = answer;
            } else if (typeof answer === 'string' || typeof answer === 'number') {
                // Convert primitive to {mode, value} with default essay mode
                normalizedAnswers[key] = { mode: 'essay', value: String(answer) };
            }
        });
    }
    
    return {
      ...rest,
      assignment_id: assignmentId,
      student_id: studentId,
      submitted_at: new Date().toISOString(),
      status: SUBMISSION_STATUS.SUBMITTED,
      answers: Object.keys(normalizedAnswers).length > 0 ? normalizedAnswers : rest.answers
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
