import { createFileRoute } from "@tanstack/react-router";
import { withHandler } from "@/lib/api/api-utils";
import { learningService } from "@/lib/services";
import { CourseMapper, LearningMapper } from "@/lib/mappers";
import { rbac } from "@/lib/auth/rbac";
import { CourseDomain } from "@/lib/domain/course.domain";
import { LearningDomain } from "@/lib/domain/learning.domain";
import { sanitizeObject } from "@/lib/validation";
import { BadRequestError, UnauthorizedError } from "@/lib/api-error";

const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
  const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;

  switch (action) {
    case "courses": {
      let teacherId = searchParams.get("teacherId") || undefined;
      if (user.role === "teacher") teacherId = user.id;
      const courses = await learningService.getCourses(teacherId, user.sessionId!, limit, offset);
      return courses.map(CourseMapper.toDTO);
    }
    case "lessons": {
      const courseId = searchParams.get("courseId");
      if (!courseId) throw new BadRequestError("courseId is required");
      const lessons = await learningService.getLessons(courseId, user.sessionId!, user.id, user.role);
      return lessons.map(LearningMapper.toLessonDTO);
    }
    case "materials": {
      const courseId = searchParams.get("courseId") || undefined;
      const materials = await learningService.getMaterials(courseId, user.sessionId!, user.id, user.role, { limit, offset });
      return materials.map(LearningMapper.toMaterialDTO);
    }
    default:
      throw new BadRequestError("Invalid GET action");
  }
});

const POST = withHandler(async (user, request) => {
  const body = sanitizeObject(await request.json()) as Record<string, any>;
  const { action, ...data } = body;

  switch (action) {
    case "save-course": {
      if (!rbac.can(user, "course:create") && !rbac.can(user, "course:update")) throw new UnauthorizedError();
      CourseDomain.validate(data);
      const course = await learningService.saveCourse(user.id, user.full_name, data, user.sessionId!, user);
      return CourseMapper.toDTO(course);
    }
    case "save-lesson": {
      if (!rbac.can(user, "lesson:manage")) throw new UnauthorizedError();
      LearningDomain.validateLesson(data);
      const lesson = await learningService.saveLesson(data, user.sessionId!, user);
      return LearningMapper.toLessonDTO(lesson);
    }
    case "save-material": {
      if (!rbac.can(user, "course:update")) throw new UnauthorizedError();
      LearningDomain.validateMaterial(data);
      const material = await learningService.saveMaterial(user.id, data, user.sessionId!, user);
      return LearningMapper.toMaterialDTO(material);
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
    case "course":
      if (!rbac.can(user, "course:delete")) throw new UnauthorizedError();
      await learningService.deleteCourse(id, user.sessionId!, user);
      return { success: true };
    case "lesson":
      if (!rbac.can(user, "lesson:manage")) throw new UnauthorizedError();
      await learningService.deleteLesson(id, user.sessionId!, user);
      return { success: true };
    case "material":
      if (!rbac.can(user, "course:update")) throw new UnauthorizedError();
      await learningService.deleteMaterial(id, user.sessionId!, user);
      return { success: true };
    default:
      throw new BadRequestError("Invalid DELETE action");
  }
});

export const Route = createFileRoute("/api/v1/learning")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
      DELETE: ({ request }) => DELETE(request),
    },
  },
});
