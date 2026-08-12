import { createFileRoute } from "@tanstack/react-router";
import { withHandler, getRequestOrigin } from "@/lib/api/api-utils";
import { authService } from "@/lib/services";
import { sanitizeObject } from "@/lib/validation";
import { BadRequestError, UnauthorizedError } from "@/lib/api-error";

/**
 * Invite issuance endpoint. Legacy clients also call `/api/v1/auth?action=generate-invite`;
 * this route exposes a dedicated POST for issuing invites (admin/teacher only).
 */
const POST = withHandler(async (user, request) => {
  if (!user) throw new UnauthorizedError();
  const body = sanitizeObject(await request.json()) as Record<string, any>;
  if (!body.role) throw new BadRequestError("role is required");
  return authService.generateInvite(user, body.role, body.email, getRequestOrigin(request));
});

export const Route = createFileRoute("/api/v1/auth/invite")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
