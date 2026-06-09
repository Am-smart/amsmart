import { createFileRoute } from "@tanstack/react-router";

/**
 * Auth invites (issue)
 * Migrated from legacy Next.js route — handler bodies are stubs.
 * Implement using `getDatabase()` / `getStorage()` from
 * `@/lib/data/provider.server` to stay provider-agnostic.
 */
export const Route = createFileRoute("/api/v1/auth/invite")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/auth/invite route.
        return Response.json({ ok: true, route: "/api/v1/auth/invite", method: "GET" }, { status: 501 });
      },
      POST: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/auth/invite route.
        return Response.json({ ok: true, route: "/api/v1/auth/invite", method: "POST" }, { status: 501 });
      },
      DELETE: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/auth/invite route.
        return Response.json({ ok: true, route: "/api/v1/auth/invite", method: "DELETE" }, { status: 501 });
      },
    },
  },
});
