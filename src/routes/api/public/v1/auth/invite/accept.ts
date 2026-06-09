import { createFileRoute } from "@tanstack/react-router";

/**
 * Public: accept invite
 * Migrated from legacy Next.js route — handler bodies are stubs.
 * Implement using `getDatabase()` / `getStorage()` from
 * `@/lib/data/provider.server` to stay provider-agnostic.
 */
export const Route = createFileRoute("/api/public/v1/auth/invite/accept")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/public/v1/auth/invite/accept route.
        return Response.json({ ok: true, route: "/api/public/v1/auth/invite/accept", method: "GET" }, { status: 501 });
      },
      POST: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/public/v1/auth/invite/accept route.
        return Response.json({ ok: true, route: "/api/public/v1/auth/invite/accept", method: "POST" }, { status: 501 });
      },
    },
  },
});
