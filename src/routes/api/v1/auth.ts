import { createFileRoute } from "@tanstack/react-router";

/**
 * Auth (login/logout/me/refresh)
 * Migrated from legacy Next.js route — handler bodies are stubs.
 * Implement using `getDatabase()` / `getStorage()` from
 * `@/lib/data/provider.server` to stay provider-agnostic.
 */
export const Route = createFileRoute("/api/v1/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/auth route.
        return Response.json({ ok: true, route: "/api/v1/auth", method: "GET" }, { status: 501 });
      },
      POST: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/auth route.
        return Response.json({ ok: true, route: "/api/v1/auth", method: "POST" }, { status: 501 });
      },
      DELETE: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/auth route.
        return Response.json({ ok: true, route: "/api/v1/auth", method: "DELETE" }, { status: 501 });
      },
    },
  },
});
