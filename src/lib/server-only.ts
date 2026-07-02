/**
 * Runtime guard: throws immediately if a module that imports this file
 * is evaluated in a browser environment.
 *
 * This is defense-in-depth on top of the bundler's `*.server.ts` filename
 * boundary. Import it at the top of any module that must never reach the
 * client (DB provider seams, admin/service-role code, secret readers):
 *
 *     import "@/lib/server-only";
 *
 * If a future refactor accidentally pulls the module into the client graph,
 * the app fails loudly at load time instead of silently shipping server code
 * (or worse, secrets) to the browser.
 *
 * NOTE ON SUPABASE KEYS
 * ---------------------
 * Supabase currently ships TWO public-key formats. They are NOT the same
 * thing as the service-role key, but they ARE interchangeable at the client:
 *
 *   - Legacy "anon key"        — JWT format (`eyJhbGciOi...`), 3 dot-separated
 *                                parts. Being phased out.
 *   - New "publishable key"    — opaque format (`sb_publishable_...`). This
 *                                is what Lovable Cloud provisions today and
 *                                what this project uses in `.env` as
 *                                `SUPABASE_PUBLISHABLE_KEY` /
 *                                `VITE_SUPABASE_PUBLISHABLE_KEY`.
 *
 * Both are safe to expose to the browser and are subject to Row-Level
 * Security. The `SUPABASE_SERVICE_ROLE_KEY` (or `sb_secret_*`) bypasses RLS
 * and MUST stay server-only — that is exactly what this guard protects.
 */

if (typeof window !== "undefined") {
  throw new Error(
    "[server-only] A server-only module was imported from client code. " +
      "Move the call into a createServerFn handler or a server route. " +
      "See src/lib/server-only.ts for details.",
  );
}

export {};