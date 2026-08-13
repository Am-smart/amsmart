import { createFileRoute } from "@tanstack/react-router";
import { setCookie, deleteCookie } from "@tanstack/react-start/server";
import { authService } from "@/lib/services";
import { AppError } from "@/lib/api-error";
import {
  INVITE_ERROR_APP_CODES,
  INVITE_ERROR_PARAM,
  type InviteErrorCode,
} from "@/lib/auth/invite-errors";

/**
 * Public invite accept — validates the invite token, stashes a short-lived
 * `app-invite-session` cookie, then redirects to the landing page with a
 * signup flag. No auth required.
 */
function redirect(location: string): Response {
  // NOTE: `Response.redirect()` returns immutable headers, which breaks
  // Set-Cookie merging in the server runtime — build the response manually.
  return new Response(null, { status: 302, headers: { Location: location } });
}

function redirectWithError(base: URL, code: InviteErrorCode): Response {
  // Any stale invite context must not leak into the signup form.
  try { deleteCookie("app-invite-session", { path: "/" }); } catch { /* noop */ }
  const url = new URL("/", base);
  url.searchParams.set(INVITE_ERROR_PARAM, code);
  return redirect(url.toString());
}

async function handleAccept(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return redirectWithError(url, "missing");

  try {
    const invite = await authService.validateInvite(token);
    setCookie(
      "app-invite-session",
      JSON.stringify({
        inviteId: invite.id,
        type: invite.type,
        email: invite.email,
        role: invite.role,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      },
    );
    const redirectUrl = new URL("/", url);
    redirectUrl.searchParams.set("signup", "true");
    return redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Invite validation failed:", error);
    const appCode = error instanceof AppError ? error.code : undefined;
    const code =
      (appCode && INVITE_ERROR_APP_CODES[appCode as keyof typeof INVITE_ERROR_APP_CODES]) || "invalid";
    return redirectWithError(url, code);
  }
}

export const Route = createFileRoute("/api/public/v1/auth/invite/accept")({
  server: {
    handlers: {
      GET: ({ request }) => handleAccept(request),
      POST: ({ request }) => handleAccept(request),
    },
  },
});
