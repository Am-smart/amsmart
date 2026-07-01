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
  if (!sessionId) return query;

  const qHeaders = query as unknown as { headers?: (h: Record<string, string>) => T };
  if (qHeaders && typeof qHeaders.headers === "function") {
    return qHeaders.headers({ "x-session-id": sessionId });
  }

  const q = query as unknown as { headers?: Record<string, string> };
  if (q && typeof q === "object") {
    q.headers = { ...(q.headers ?? {}), "x-session-id": sessionId };
  }
  return query;
}