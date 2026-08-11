import { DatabaseError, DatabaseResponse } from '../types';
import { withSession } from '../supabase.server';

/**
 * Pagination guard-rails.
 *
 * PostgREST silently truncates unbounded reads at its server-side cap, which
 * makes "SELECT everything" list queries look correct in dev and quietly lose
 * rows in production. Every list query goes through `applyPagination`, which
 * always sends an explicit, clamped range so results are deterministic and
 * bounded no matter what a caller passes.
 */
export const DEFAULT_PAGE_SIZE = 200;
export const MAX_PAGE_SIZE = 1000;

/**
 * Column projection for embedded `users` relations. Never `users(*)` — the
 * users table holds password hashes and reset tokens that must never travel
 * with a joined row.
 */
export const SAFE_USER_SELECT =
  'id, full_name, email, role, phone, active, created_at, updated_at, version, metadata';

export const dbUtils = {
  /**
   * Prepares upsert data with version increment and updated_at
   */
  prepareUpsert<T extends { version?: number; id?: string }>(
    entity: Partial<T>,
    excludeFields: string[] = []
  ): Partial<T> & { updated_at: string; version: number } {
    const { version, id, ...rest } = entity as Record<string, unknown>;

    // Filter out excluded fields (like joined relations)
    const cleanedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (!excludeFields.includes(key)) {
        cleanedData[key] = value;
      }
    }

    return {
      ...cleanedData,
      ...(id ? { id } : {}),
      updated_at: new Date().toISOString(),
      version: (Number(version) || 0) + 1
    } as Partial<T> & { updated_at: string; version: number };
  },

  /**
   * Applies optimistic concurrency control (version check) to a query
   */
  applyVersionCheck(
    query: any,
    id?: string,
    version?: number
  ): any {
    if (id && version !== undefined) {
      return query.eq('id', id).eq('version', version);
    }
    return query;
  },

  /**
   * Handles common database errors and converts them to standardized error messages.
   */
  handleUpsertError(error: DatabaseError | null, entityName: string, id?: string, version?: number): never {
    if (!error) throw new Error('Unknown database error');

    // PGRST116 is Supabase/PostgREST code for "JSON object requested, but no rows returned"
    // often caused by our .eq('version', oldVersion) check failing.
    if (id && version !== undefined && (error.code === 'PGRST116' || error.message?.includes('concurrency'))) {
      throw new Error(`Conflict detected: ${entityName} has been updated by another user.`);
    } else {
      throw new Error(error.message || 'Database operation failed');
    }
  },

  /**
   * Generic upsert handler with version checking and standardized error handling.
   */
  async upsert<T extends { id?: string; version?: number }>(
    table: { upsert: (data: Record<string, unknown> | Record<string, unknown>[], options?: { onConflict?: string }) => { select: () => { single: () => PromiseLike<DatabaseResponse<T>> } } },
    entity: Partial<T>,
    entityName: string,
    sessionId: string,
    options: { onConflict?: string; excludeFields?: string[] } = {}
  ): Promise<T> {
    const upsertData = this.prepareUpsert(entity as unknown as { version?: number; id?: string }, options.excludeFields);

    const upsertOptions: { onConflict?: string } = {};
    if (!entity.id && options.onConflict) {
      upsertOptions.onConflict = options.onConflict;
    }

    let query = withSession(table, sessionId).upsert(upsertData, upsertOptions);

    const entityWithVersion = entity as { id?: string; version?: number };
    query = this.applyVersionCheck(query, entityWithVersion.id, entityWithVersion.version);

    const { data, error } = await query.select().single();

    if (error) {
      this.handleUpsertError(error, entityName, entityWithVersion.id, entityWithVersion.version);
    }

    return data as unknown as T;
  },

  /**
   * Applies bounded pagination to a Supabase query.
   *
   * - `limit` is clamped to `MAX_PAGE_SIZE`.
   * - A missing `limit` falls back to `DEFAULT_PAGE_SIZE` so no query is ever
   *   unbounded.
   * - `offset` always uses `range()` so limit + offset cannot conflict.
   */
  applyPagination<Q extends { limit: (n: number) => Q; range: (from: number, to: number) => Q }>(
    query: Q,
    options: { limit?: number; offset?: number } = {}
  ): Q {
    const requested = Number(options.limit);
    const limit = Math.min(
      Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    const rawOffset = Number(options.offset);
    const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? Math.floor(rawOffset) : 0;

    if (offset > 0) return query.range(offset, offset + limit - 1);
    return query.limit(limit);
  },

  /**
   * Standardized error handling for database operations
   */
  handleError(error: { message: string } | null | unknown): never {
    if (error && typeof error === 'object' && 'message' in error) {
        throw new Error((error as { message: string }).message || 'Database operation failed');
    } else {
        throw new Error('Unknown database error');
    }
  }
};
