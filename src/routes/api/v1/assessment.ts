import { createFileRoute } from "@tanstack/react-router";
import { withHandler } from "@/lib/api/api-utils";
import { assessmentService } from "@/lib/services";
import { AssessmentMapper } from "@/lib/mappers";
import { rbac } from "@/lib/auth/rbac";
import { AssessmentDomain } from "@/lib/domain/assessment.domain";
import { sanitizeObject } from "@/lib/validation";
import { BadRequestError, UnauthorizedError } from "@/lib/api-error";

const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;

  switch (action) {
    case "assignments": {
      const teacherId = searchParams.get("teacherId") || undefined;
      const courseId = searchParams.get("courseId") || undefined;
      const assignments = await assessmentService.getAssignments(teacherId, courseId, user.sessionId!, limit, offset, user.id, user.role);
      return assignments.map(AssessmentMapper.toAssignmentDTO);
    }
    case "quizzes": {
      const id = searchParams.get("id") || undefined;
      if (id) {
        const quiz = await assessmentService.getQuiz(id, user.sessionId!, user.id, user.role);
        return AssessmentMapper.toQuizDTO(quiz);
      }
      const courseId = searchParams.get("courseId") || undefined;
      const teacherId = searchParams.get("teacherId") || undefined;
      const quizzes = await assessmentService.getQuizzes(courseId, teacherId, user.sessionId!, limit, offset, user.id, user.role);
      return quizzes.map(AssessmentMapper.toQuizDTO);
    }
    case "submissions": {
      const assignmentId = searchParams.get("assignmentId") || undefined;
      const studentId = searchParams.get("studentId") || undefined;
      const status = searchParams.get("status") || undefined;
      const courseId = searchParams.get("courseId") || undefined;
      const subs = await assessmentService.getSubmissions(assignmentId, studentId, user.sessionId!, limit, offset, user.id, user.role, status, courseId);
      const dtos = subs.map(AssessmentMapper.toSubmissionDTO);
      // Hide draft grades, teacher feedback, and per-question scores from any
      // viewer without grading authority until the submission is finalized.
      // Admins always see grading data; teachers see it only for submissions
      // scoped to assignments they own (already enforced upstream in
      // assessmentService.getSubmissions, so their view is safe).
      const canSeeDraftGrading = user.role === "admin" || user.role === "teacher";
      if (canSeeDraftGrading) return dtos;
      return dtos.map((d) => AssessmentMapper.stripUnfinalizedGrading(d));
    }
    default:
      throw new BadRequestError("Invalid GET action");
  }
});

const POST = withHandler(async (user, request) => {
  const body = sanitizeObject(await request.json()) as Record<string, any>;
  const { action, ...data } = body;

  switch (action) {
    case "save-assignment": {
      if (!rbac.can(user, "assignment:manage")) throw new UnauthorizedError();
      AssessmentDomain.validateAssignment(data);
      const s = AssessmentDomain.sanitizeEntity(data);
      const a = await assessmentService.saveAssignment(user.id, s, user.sessionId!, user);
      return AssessmentMapper.toAssignmentDTO(a);
    }
    case "submit-assignment": {
      if (!rbac.can(user, "assignment:submit")) throw new UnauthorizedError();
      const { assignmentId, ...content } = data;
      if (!assignmentId) throw new BadRequestError("assignmentId is required");
      AssessmentDomain.validateSubmission(content);
      
      // Fetch assignment to validate answer modes against allowed submission types
      const { assessmentDb } = await import('@/lib/database/assessment.db.server');
      const assignment = await assessmentDb.findAssignmentById(assignmentId, user.sessionId!);
      // Group assignments are locked to their members.
      if (assignment && !AssessmentDomain.canStudentAccessAssignment(assignment, user.id)) {
        throw new UnauthorizedError("You are not a member of a group for this assignment");
      }
      if (assignment?.questions && content.answers) {
        AssessmentDomain.validateAnswerModes(content.answers, assignment.questions);
      }
      
      const sub = await assessmentService.submitAssignment(user.id, assignmentId, content, user.sessionId!);
      // Never echo grading fields back on a fresh student submission —
      // if a legacy draft record carried them, strip before returning.
      return AssessmentMapper.stripUnfinalizedGrading(
        AssessmentMapper.toSubmissionDTO(sub)
      );
    }
    case "request-regrade": {
      if (!rbac.can(user, "assignment:submit")) throw new UnauthorizedError();
      const { assignmentId, reason } = data;
      if (!assignmentId) throw new BadRequestError("assignmentId is required");
      const sub = await assessmentService.requestRegrade(user.id, assignmentId, String(reason || ""), user.sessionId!);
      return AssessmentMapper.stripUnfinalizedGrading(AssessmentMapper.toSubmissionDTO(sub));
    }
    case "save-quiz": {
      if (!rbac.can(user, "quiz:manage")) throw new UnauthorizedError();
      AssessmentDomain.validateQuiz(data);
      const s = AssessmentDomain.sanitizeEntity(data);
      const q = await assessmentService.saveQuiz(user.id, s, user.sessionId!, user);
      return AssessmentMapper.toQuizDTO(q);
    }
    case "submit-quiz": {
      if (!rbac.can(user, "quiz:take")) throw new UnauthorizedError();
      const { quizId, ...content } = data;
      if (!quizId) throw new BadRequestError("quizId is required");
      return assessmentService.submitQuiz(user.id, quizId, content, user.sessionId!);
    }
    default:
      throw new BadRequestError("Invalid POST action");
  }
});

const DELETE = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");
  if (!id) throw new BadRequestError("id is required");

  switch (action) {
    case "assignment":
      if (!rbac.can(user, "assignment:manage")) throw new UnauthorizedError();
      await assessmentService.deleteAssignment(id, user.sessionId!, user);
      return { success: true };
    case "quiz":
      if (!rbac.can(user, "quiz:manage")) throw new UnauthorizedError();
      await assessmentService.deleteQuiz(id, user.sessionId!, user);
      return { success: true };
    default:
      throw new BadRequestError("Invalid DELETE action");
  }
});

const PATCH = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");
  const body = sanitizeObject(await request.json()) as Record<string, any>;
  const { action: _a, ...data } = body;
  if (!id) throw new BadRequestError("id is required");

  switch (action) {
    case "grade-submission": {
      if (!rbac.can(user, "assignment:grade")) throw new UnauthorizedError();
      // Validate grade if provided (not required when using question_scores)
      if (data.grade !== undefined && (data.grade < 0 || data.grade > 100)) {
        throw new BadRequestError("Grade must be between 0 and 100");
      }
      // Validate that at least question_scores or grade is provided
      if (data.grade === undefined && (!data.question_scores || Object.keys(data.question_scores).length === 0)) {
        throw new BadRequestError("Either grade or question_scores must be provided");
      }
      const draft = searchParams.get("draft") === "true";
      await assessmentService.gradeSubmission(id, data, user.sessionId!, user.id, user.role, { draft });
      return { success: true };
    }
    default:
      throw new BadRequestError("Invalid PATCH action");
  }
});

export const Route = createFileRoute("/api/v1/assessment")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
      PATCH: ({ request }) => PATCH(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
