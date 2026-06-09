import { createFileRoute } from "@tanstack/react-router";

/**
 * System (settings/logs/notifications/health)
 * Migrated from legacy Next.js route — handler bodies are stubs.
 * Implement using `getDatabase()` / `getStorage()` from
 * `@/lib/data/provider.server` to stay provider-agnostic.
 */
export const Route = createFileRoute("/api/v1/system")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/system route.
        return Response.json({ ok: true, route: "/api/v1/system", method: "GET" }, { status: 501 });
      },
      POST: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/system route.
        return Response.json({ ok: true, route: "/api/v1/system", method: "POST" }, { status: 501 });
      },
      PUT: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/system route.
        return Response.json({ ok: true, route: "/api/v1/system", method: "PUT" }, { status: 501 });
      },
      DELETE: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/system route.
        return Response.json({ ok: true, route: "/api/v1/system", method: "DELETE" }, { status: 501 });
      },
    },
  },
});
