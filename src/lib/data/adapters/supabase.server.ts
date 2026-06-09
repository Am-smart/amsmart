/**
 * Supabase implementation of the `Database` and `Storage` interfaces.
 *
 * Server-only (.server.ts) — uses the service-role admin client, so it must
 * never be reachable from the client bundle. Call it exclusively from inside
 * `createServerFn` handlers or server routes.
 */

import { supabaseAdmin as typedAdmin } from "@/integrations/supabase/client.server";
import type { Database, QueryOptions, Where } from "../database";
import type { Storage, UploadOptions, SignedUrlOptions } from "../storage";

// Cast away the generic schema typing: this adapter is schema-agnostic by
// design — typed access lives in higher-level repository modules.
const supabaseAdmin = typedAdmin as unknown as {
  from: (table: string) => any;
  storage: { from: (bucket: string) => any };
  rpc: (name: string, args?: Record<string, unknown>) => any;
};

function applyWhere<Q extends { eq: (col: string, val: unknown) => Q }>(q: Q, where?: Where): Q {
  if (!where) return q;
  let out = q;
  for (const [k, v] of Object.entries(where)) out = out.eq(k, v);
  return out;
}

function applyQuery<Q extends { eq: (col: string, val: unknown) => Q; order: (col: string, opts?: { ascending?: boolean }) => Q; range: (from: number, to: number) => Q; limit: (n: number) => Q }>(
  q: Q,
  options: QueryOptions = {},
): Q {
  let out = applyWhere(q, options.where);
  if (options.orderBy) out = out.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
  if (options.offset !== undefined && options.limit !== undefined) {
    out = out.range(options.offset, options.offset + options.limit - 1);
  } else if (options.limit !== undefined) {
    out = out.limit(options.limit);
  }
  return out;
}

export const supabaseDatabase: Database = {
  async find<T>(table: string, options: QueryOptions = {}): Promise<T[]> {
    const base = (supabaseAdmin.from(table) as any).select(options.select ?? "*");
    const { data, error } = await applyQuery(base, options);
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  },

  async findOne<T>(table: string, options: QueryOptions = {}): Promise<T | null> {
    const rows = await this.find<T>(table, { ...options, limit: 1 });
    return rows[0] ?? null;
  },

  async insert<T>(table: string, rows: Partial<T> | Partial<T>[]): Promise<T[]> {
    const { data, error } = await (supabaseAdmin.from(table) as any).insert(rows).select();
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  },

  async update<T>(table: string, patch: Partial<T>, where: Where): Promise<T[]> {
    const base = (supabaseAdmin.from(table) as any).update(patch);
    const { data, error } = await applyWhere(base, where).select();
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  },

  async upsert<T>(table: string, rows: Partial<T> | Partial<T>[], options: { onConflict?: string } = {}): Promise<T[]> {
    const { data, error } = await (supabaseAdmin.from(table) as any)
      .upsert(rows, options.onConflict ? { onConflict: options.onConflict } : undefined)
      .select();
    if (error) throw new Error(error.message);
    return (data ?? []) as T[];
  },

  async delete(table: string, where: Where): Promise<void> {
    const base = (supabaseAdmin.from(table) as any).delete();
    const { error } = await applyWhere(base, where);
    if (error) throw new Error(error.message);
  },

  async rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await (supabaseAdmin as any).rpc(name, args);
    if (error) throw new Error(error.message);
    return data as T;
  },

  async count(table: string, where?: Where): Promise<number> {
    const base = (supabaseAdmin.from(table) as any).select("*", { count: "exact", head: true });
    const { count, error } = await applyWhere(base, where);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
};

export const supabaseStorage: Storage = {
  async upload(bucket, path, data, options: UploadOptions = {}) {
    const { data: res, error } = await supabaseAdmin.storage.from(bucket).upload(path, data as Blob, {
      contentType: options.contentType,
      upsert: options.upsert,
      cacheControl: options.cacheControl,
    });
    if (error) throw new Error(error.message);
    return { path: res?.path ?? path };
  },

  async download(bucket, path) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
    if (error) throw new Error(error.message);
    return data;
  },

  getPublicUrl(bucket, path) {
    return supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  },

  async getSignedUrl(bucket, path, options: SignedUrlOptions = {}) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, options.expiresIn ?? 3600);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  },

  async remove(bucket, path) {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
    if (error) throw new Error(error.message);
  },

  async list(bucket, prefix) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(prefix);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<{ name: string; updated_at: string | null; metadata?: { size?: number } }>).map((o) => ({
      name: o.name,
      size: o.metadata?.size,
      updatedAt: o.updated_at ?? undefined,
    }));
  },
};