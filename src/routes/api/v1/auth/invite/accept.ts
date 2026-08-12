import { createFileRoute } from "@tanstack/react-router";

/**
 * Backwards-compatible alias for invite links that were generated with the
 * old (auth-gated) path. Redirects to the public accept endpoint, preserving
 * the token.
 */
function redirectToPublic(request: Request): Response {
  const url = new URL(request.url);
  const target = new URL("/api/public/v1/auth/invite/accept", url);
  const token = url.searchParams.get("token");
  if (token) target.searchParams.set("token", token);
  return new Response(null, { status: 302, headers: { Location: target.toString() } });
}

export const Route = createFileRoute("/api/v1/auth/invite/accept")({
  server: {
    handlers: {
      GET: ({ request }) => redirectToPublic(request),
      POST: ({ request }) => redirectToPublic(request),
    },
  },
});