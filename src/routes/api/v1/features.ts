/**
 * Feature API surface for certificates, proctoring, study progress and
 * curriculum topics. Mirrors the action-dispatch shape of `/api/v1/system`
 * so client callers stay uniform. Authorization lives in the service layer.
 */
import { createFileRoute } from "@tanstack/react-router";
import { withHandler } from "@/lib/api/api-utils";
import { certificateService, proctoringService, studyService, curriculumService } from "@/lib/services";
import { CertificateMapper, ProctoringMapper, StudyMapper, CurriculumMapper } from "@/lib/mappers";
import { BadRequestError, UnauthorizedError } from "@/lib/api-error";
import { sanitizeObject } from "@/lib/validation";

const num = (v: string | null): number | undefined => (v ? parseInt(v, 10) : undefined);

const GET = withHandler(async (user, request) => {
  if (!user) throw new UnauthorizedError();
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const sessionId = user.sessionId!;
  const limit = num(searchParams.get("limit"));
  const offset = num(searchParams.get("offset"));

  switch (action) {
    case "certificates": {
      const certs = await certificateService.list(user, sessionId, {
        userId: searchParams.get("userId") || undefined,
        courseId: searchParams.get("courseId") || undefined,
        limit,
        offset,
      });
      return certs.map(CertificateMapper.toDTO);
    }
    case "certificate": {
      const id = searchParams.get("id");
      if (!id) throw new BadRequestError("id is required");
      return CertificateMapper.toDTO(await certificateService.get(user, id, sessionId));
    }
    case "violations": {
      const violations = await proctoringService.list(user, sessionId, {
        userId: searchParams.get("userId") || undefined,
        assessmentId: searchParams.get("assessmentId") || undefined,
        proctorSessionId: searchParams.get("proctorSessionId") || undefined,
        severity: searchParams.get("severity") || undefined,
        since: searchParams.get("since") || undefined,
        limit,
        offset,
      });
      return violations.map(ProctoringMapper.toViolationDTO);
    }
    case "active-proctored-sessions":
      return proctoringService.activeSessions(user, sessionId);
    case "proctoring-risk": {
      const proctorSessionId = searchParams.get("proctorSessionId");
      if (!proctorSessionId) throw new BadRequestError("proctorSessionId is required");
      return proctoringService.riskScore(user, proctorSessionId, sessionId);
    }
    case "study-sessions": {
      const sessions = await studyService.list(user, sessionId, {
        userId: searchParams.get("userId") || undefined,
        courseId: searchParams.get("courseId") || undefined,
        since: searchParams.get("since") || undefined,
        limit,
        offset,
      });
      return sessions.map(StudyMapper.toDTO);
    }
    case "study-summary":
      return studyService.summary(user, sessionId, {
        userId: searchParams.get("userId") || undefined,
        days: num(searchParams.get("days")),
      });
    case "topics": {
      const courseId = searchParams.get("courseId");
      if (!courseId) throw new BadRequestError("courseId is required");
      const topics = await curriculumService.getTopics(user, courseId, sessionId);
      return topics.map(CurriculumMapper.toTopicDTO);
    }
    case "discussion-views":
      return curriculumService.getDiscussionViews(user, sessionId);
    default:
      throw new BadRequestError("Unknown action");
  }
});

const POST = withHandler(async (user, request) => {
  if (!user) throw new UnauthorizedError();
  const sessionId = user.sessionId!;
  const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const body = sanitizeObject(raw) as Record<string, any>;
  const action = body.action as string;

  switch (action) {
    case "issue-certificate":
      return CertificateMapper.toDTO(
        await certificateService.issue(
          user,
          {
            user_id: body.user_id,
            course_id: body.course_id,
            final_grade: body.final_grade ?? null,
            template: body.template,
            title: body.title,
          },
          sessionId
        )
      );
    case "revoke-certificate": {
      if (!body.id) throw new BadRequestError("id is required");
      return CertificateMapper.toDTO(await certificateService.revoke(user, body.id, body.reason, sessionId));
    }
    case "delete-certificate": {
      if (!body.id) throw new BadRequestError("id is required");
      await certificateService.remove(user, body.id, sessionId);
      return { deleted: true };
    }
    case "record-violations":
      return proctoringService.record(user, body.violations ?? body.violation, sessionId);
    case "start-study-session":
      return StudyMapper.toDTO(await studyService.start(user, body.session ?? body, sessionId));
    case "end-study-session": {
      if (!body.id) throw new BadRequestError("id is required");
      return StudyMapper.toDTO(
        await studyService.end(
          user,
          body.id,
          { focus_seconds: body.focus_seconds, idle_seconds: body.idle_seconds, ended_at: body.ended_at },
          sessionId
        )
      );
    }
    case "save-topic":
      return CurriculumMapper.toTopicDTO(await curriculumService.saveTopic(user, body.topic ?? body, sessionId));
    case "delete-topic": {
      if (!body.id) throw new BadRequestError("id is required");
      await curriculumService.deleteTopic(user, body.id, sessionId);
      return { deleted: true };
    }
    case "mark-discussion-viewed":
      await curriculumService.markDiscussionViewed(user, body.discussionId, sessionId);
      return { ok: true };
    default:
      throw new BadRequestError("Unknown action");
  }
});

export const Route = createFileRoute("/api/v1/features")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
