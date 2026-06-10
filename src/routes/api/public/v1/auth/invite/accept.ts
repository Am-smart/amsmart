import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";
import { authService } from "@/lib/services";

/**
 * Public invite accept — validates the invite token, stashes a short-lived
 * `app-invite-session` cookie, then redirects to the landing page with a
 * signup flag. No auth required.
 */
async function handleAccept(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return Response.redirect(new URL("/", url).toString(), 302);

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
    return Response.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    console.error("Invite validation failed:", error);
    return Response.redirect(new URL("/?error=invalid_invite", url).toString(), 302);
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
