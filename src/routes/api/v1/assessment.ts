import { createFileRoute } from "@tanstack/react-router";

/**
 * Assessment (assignments/quizzes/submissions)
 * Migrated from legacy Next.js route — handler bodies are stubs.
 * Implement using `getDatabase()` / `getStorage()` from
 * `@/lib/data/provider.server` to stay provider-agnostic.
 */
export const Route = createFileRoute("/api/v1/assessment")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/assessment route.
        return Response.json({ ok: true, route: "/api/v1/assessment", method: "GET" }, { status: 501 });
      },
      POST: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/assessment route.
        return Response.json({ ok: true, route: "/api/v1/assessment", method: "POST" }, { status: 501 });
      },
      PUT: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/assessment route.
        return Response.json({ ok: true, route: "/api/v1/assessment", method: "PUT" }, { status: 501 });
      },
      DELETE: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/assessment route.
        return Response.json({ ok: true, route: "/api/v1/assessment", method: "DELETE" }, { status: 501 });
      },
    },
  },
});
