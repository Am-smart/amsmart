/**
 * TanStack Start equivalent of the legacy Next.js `withHandler` wrapper.
 *
 * Mirrors the legacy signature `(user, request) => result` so route bodies
 * port over with minimal changes. Returns an async `(request) => Response`
 * that's suitable as a TanStack server-route method handler.
 *
 * Auth/session is read from the project's custom `app-user-session` cookie
 * via `@tanstack/react-start/server` (NOT `next/headers`).
 */
import { getCookie, deleteCookie, getRequestHeader } from "@tanstack/react-start/server";
import { authService } from "@/lib/services";
import type { User } from "@/lib/types";
import { getErrorMessage, mapErrorToStatus } from "@/lib/api-error";

const SESSION_COOKIE = "app-user-session";

export async function getSessionUser(): Promise<User | null> {
  try {
    const token = getCookie(SESSION_COOKIE);
    if (!token) return null;
    const userSession = await authService.validateSession(token);
    return (userSession as User) ?? null;
  } catch {
    return null;
  }
}

export function jsonSuccess<T>(data: T, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export interface HandlerOptions {
  requireAuth?: boolean;
  checkCSRF?: boolean;
}

/**
 * Wraps a legacy-style handler `(user, request) => result` into a TanStack
 * server-route method function. Enforces optional auth + CSRF, normalizes
 * success/error response shape, and clears the session cookie if the user's
 * session is invalidated server-side.
 */
export function withHandler<T>(
  handler: (user: User, request: Request) => Promise<T>,
  options: HandlerOptions = {},
) {
  const { requireAuth = true, checkCSRF = true } = options;

  return async (request: Request): Promise<Response> => {
    // CSRF Protection on mutating requests
    if (checkCSRF && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const origin = getRequestHeader("origin");
      const referer = getRequestHeader("referer");
      const host = getRequestHeader("host");

      if (!origin && !referer) {
        return jsonError("CSRF Protection: Origin/Referer required", 403);
      }
      if (origin) {
        try {
          if (new URL(origin).host !== host) return jsonError("CSRF Protection: Invalid Origin", 403);
        } catch {
          return jsonError("CSRF Protection: Malformed Origin", 403);
        }
      } else if (referer) {
        try {
          if (new URL(referer).host !== host) return jsonError("CSRF Protection: Invalid Referer", 403);
        } catch {
          return jsonError("CSRF Protection: Malformed Referer", 403);
        }
      }

      const requestedWith = getRequestHeader("x-requested-with");
      const sessionHeader = getRequestHeader("x-session-id");
      if (!requestedWith && !sessionHeader) {
        return jsonError("CSRF Protection: Missing X-Requested-With header", 403);
      }
    }

    try {
      const user = await getSessionUser();
      if (requireAuth && !user) {
        return jsonError("Unauthorized", 401);
      }
      const result = await handler(user as User, request);
      return jsonSuccess(result);
    } catch (error) {
      const message = getErrorMessage(error);
      const status = mapErrorToStatus(error);
      if (status === 401) {
        try { deleteCookie(SESSION_COOKIE, { path: "/" }); } catch { /* noop */ }
      }
      return jsonError(message, status);
    }
  };
}