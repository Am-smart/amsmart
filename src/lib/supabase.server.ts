/**
 * Centralized Supabase entry used by the project's `src/lib/database/*` layer.
 *
 * This module is the SINGLE seam between the legacy db layer and the underlying
 * provider. To swap databases, replace what `supabase` resolves to here (and
 * the matching admin client in `./supabase-admin`). No call site in the
 * `src/lib/database/*`, `src/lib/services/*`, or `src/lib/domain/*` layers
 * needs to change.
 *
 * The browser-safe `supabase` re-export goes through the auto-generated
 * Lovable Cloud client at `@/integrations/supabase/client` (publishable key,
 * persists session in localStorage in the browser).
 */
import { supabase as cloudSupabase } from "@/integrations/supabase/client";

export const supabase = cloudSupabase as unknown as any;
export const supabaseServer = supabase;

/**
 * Inject the project's custom session id into a PostgREST query / RPC.
 * Supabase v2 builders expose `.headers({...})`; older callers may pass a
 * raw object — both shapes are honored.
 */
export function withSession<T>(query: T, sessionId?: string): T {
  if (!sessionId || !query || typeof query !== "object") return query;

  // postgrest-js v2 (Supabase JS v2.107+): builders expose `.setHeader(name, value)`
  // and store headers as a `Headers` instance. Prefer the public API.
  const withSetHeader = query as unknown as {
    setHeader?: (name: string, value: string) => T;
  };
  if (typeof withSetHeader.setHeader === "function") {
    return withSetHeader.setHeader("x-session-id", sessionId);
  }

  // Older postgrest-js: `.headers` may be a Headers instance or a plain
  // record; mutate in place so we never replace the type the builder expects.
  const withHeaders = query as unknown as {
    headers?: Headers | Record<string, string> | ((h: Record<string, string>) => T);
  };
  const h = withHeaders.headers;
  if (typeof h === "function") {
    // Legacy fluent form: `.headers({...})` returns a new builder.
    return (h as (hh: Record<string, string>) => T)({ "x-session-id": sessionId });
  }
  if (h && typeof (h as Headers).set === "function") {
    (h as Headers).set("x-session-id", sessionId);
  } else if (h && typeof h === "object") {
    (h as Record<string, string>)["x-session-id"] = sessionId;
  } else {
    (withHeaders as { headers: Record<string, string> }).headers = { "x-session-id": sessionId };
  }
  return query;
}