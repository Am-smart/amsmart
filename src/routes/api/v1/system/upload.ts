import { createFileRoute } from "@tanstack/react-router";

/**
 * System upload
 * Migrated from legacy Next.js route — handler bodies are stubs.
 * Implement using `getDatabase()` / `getStorage()` from
 * `@/lib/data/provider.server` to stay provider-agnostic.
 */
export const Route = createFileRoute("/api/v1/system/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // TODO: port logic from legacy Next.js /api/v1/system/upload route.
        return Response.json({ ok: true, route: "/api/v1/system/upload", method: "POST" }, { status: 501 });
      },
    },
  },
});
