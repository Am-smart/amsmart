/**
 * Centralized admin (service-role) client used by the project's
 * `src/lib/database/*` layer. SERVER-ONLY — never reachable from client code.
 *
 * Re-exports the auto-generated Lovable Cloud admin client. To swap
 * databases, replace `cloudAdmin` with another provider's admin client (or
 * `null`) without touching any call site in the legacy db / service layers.
 */
import "@/lib/server-only";
import { supabaseAdmin as cloudAdmin } from "@/integrations/supabase/client.server";

export const adminClient = cloudAdmin as unknown as any;