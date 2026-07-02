/**
 * Provider singleton — the single seam between the app and the data backend.
 *
 * To swap to a different DB or storage (S3, R2, Drizzle/Postgres, etc.):
 *   1. Add a new adapter under `src/lib/data/adapters/<name>.server.ts`
 *      implementing the `Database` and/or `Storage` interfaces.
 *   2. Swap the imports below.
 *
 * Server-only: never import this module from client code. Call from inside
 * `createServerFn` handlers or server routes. The `server-only` import
 * below is a runtime guard that throws if this module is ever evaluated in
 * a browser environment (defense-in-depth on top of the `.server.ts`
 * filename boundary).
 */

import "@/lib/server-only";
import type { Database } from "./database";
import type { Storage } from "./storage";
import { supabaseDatabase, supabaseStorage } from "./adapters/supabase.server";

export function getDatabase(): Database {
  return supabaseDatabase;
}

export function getStorage(): Storage {
  return supabaseStorage;
}