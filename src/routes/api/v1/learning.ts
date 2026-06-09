import { createFileRoute } from "@tanstack/react-router";

/**
 * Learning (courses/lessons/materials/discussions)
 * Migrated from legacy Next.js route — handler bodies are stubs.
 * Implement using `getDatabase()` / `getStorage()` from
 * `@/lib/data/provider.server` to stay provider-agnostic.
 */
export const Route = createFileRoute("/api/v1/learning")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/learning route.
        return Response.json({ ok: true, route: "/api/v1/learning", method: "GET" }, { status: 501 });
      },
      POST: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/learning route.
        return Response.json({ ok: true, route: "/api/v1/learning", method: "POST" }, { status: 501 });
      },
      PUT: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/learning route.
        return Response.json({ ok: true, route: "/api/v1/learning", method: "PUT" }, { status: 501 });
      },
      DELETE: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/learning route.
        return Response.json({ ok: true, route: "/api/v1/learning", method: "DELETE" }, { status: 501 });
      },
    },
  },
});
