import { createFileRoute } from "@tanstack/react-router";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { withHandler } from "@/lib/api/api-utils";
import { authService } from "@/lib/services";
import { UserMapper } from "@/lib/mappers";
import { rbac } from "@/lib/auth/rbac";
import { SESSION } from "@/lib/constants";
import {
  validateLoginForm,
  normalizeEmail,
  validateSignupForm,
  normalizeInput,
  sanitizeObject,
} from "@/lib/validation";
import { UnauthorizedError, BadRequestError } from "@/lib/api-error";

const SESSION_COOKIE = "app-user-session";
const INVITE_COOKIE = "app-invite-session";
const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  switch (action) {
    case "me":
      return user ? UserMapper.toDTO(user) : null;
    case "role-count":
      return authService.getRoleCount();
    case "invite-session": {
      const c = getCookie(INVITE_COOKIE);
      if (!c) return null;
      try { return JSON.parse(c); } catch { return null; }
    }
    default:
      return user ? UserMapper.toDTO(user) : null;
  }
}, { requireAuth: false });

const POST = withHandler(async (user, request) => {
  const rawBody = await request.json();
  const body = sanitizeObject(rawBody) as Record<string, any>;
  const { action, ...data } = body;

  switch (action) {
    case "login": {
      const v = validateLoginForm(data.email, data.password || "");
      if (!v.isValid) throw new BadRequestError(v.errors[0].message);
      const result = await authService.authenticate(normalizeEmail(data.email), data.password || "");
      setCookie(SESSION_COOKIE, result.session_id, {
        ...COOKIE_BASE,
        maxAge: 60 * 60 * 24 * SESSION.EXPIRY_DAYS,
      });
      return { user: UserMapper.toDTO(result.user) };
    }
    case "signup": {
      const v = validateSignupForm(
        data.full_name, data.email, data.password || "",
        data.confirmPassword || "", data.phone,
      );
      if (!v.isValid) throw new BadRequestError(v.errors[0].message);

      const inviteCookie = getCookie(INVITE_COOKIE);
      let inviteId: string | undefined;
      if (inviteCookie) {
        try {
          const s = JSON.parse(inviteCookie);
          inviteId = s.inviteId;
          if (s.role) data.role = s.role;
          if (s.type === "email_bound" && s.email) data.email = s.email;
        } catch (e) { console.error("invite parse", e); }
      }

      const result = await authService.signup({
        full_name: normalizeInput(data.full_name),
        email: normalizeEmail(data.email),
        password: data.password || "",
        phone: data.phone ? normalizeInput(data.phone) : undefined,
        role: data.role,
      }, inviteId);

      setCookie(SESSION_COOKIE, result.session_id, {
        ...COOKIE_BASE,
        maxAge: 60 * 60 * 24 * SESSION.EXPIRY_DAYS,
      });
      if (inviteCookie) deleteCookie(INVITE_COOKIE, { path: "/" });
      return { user: UserMapper.toDTO(result.user) };
    }
    case "logout": {
      const token = getCookie(SESSION_COOKIE);
      if (token) await authService.logout(token);
      deleteCookie(SESSION_COOKIE, { path: "/" });
      return { success: true };
    }
    case "profile": {
      if (!user) throw new UnauthorizedError();
      const updated = await authService.updateUserProfile(user, user.id, data, user.sessionId!);
      return UserMapper.toDTO(updated);
    }
    case "password": {
      if (!user) throw new UnauthorizedError();
      const token = getCookie(SESSION_COOKIE);
      if (!token) throw new UnauthorizedError();
      const result = await authService.updatePassword(data.currentPassword, data.newPassword, token);
      if (result && typeof result === "object" && "success" in result && (result as any).success) {
        deleteCookie(SESSION_COOKIE, { path: "/" });
      }
      return result;
    }
    case "reset-request": {
      if (data.subAction === "request") {
        return authService.requestPasswordReset(data.email, data.reason, data.riskLevel);
      }
      if (!user) throw new UnauthorizedError();
      if (!rbac.can(user, "user:manage")) throw new UnauthorizedError();
      if (data.subAction === "approve") {
        return authService.approvePasswordReset(data.userId, data.tempPassword, user);
      }
      return authService.denyPasswordReset(data.userId, data.reason, user);
    }
    case "preferences": {
      if (!user) throw new UnauthorizedError();
      return authService.updatePreferences(data.preferences, user);
    }
    case "generate-invite": {
      if (!user) throw new UnauthorizedError();
      return authService.generateInvite(user, data.role, data.email);
    }
    default:
      throw new BadRequestError("Invalid POST action");
  }
}, { requireAuth: false, checkCSRF: true });

export const Route = createFileRoute("/api/v1/auth")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
