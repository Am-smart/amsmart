/**
 * Database abstraction — agnostic of the underlying provider.
 *
 * Implementations live in `src/lib/data/adapters/*`. The current adapter is
 * Supabase, but any provider implementing `Database` can be swapped in via
 * `src/lib/data/provider.server.ts` without touching call sites.
 *
 * Keep this interface intentionally small and storage-engine-agnostic:
 * no Supabase-specific filter operators, no PostgREST builders.
 */

export type Where = Record<string, unknown>;

export interface QueryOptions {
  select?: string;             // comma-separated column list, "*" by default
  where?: Where;               // equality filters AND-ed together
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

export interface Database {
  /** Return rows from `table` matching `options`. */
  find<T = unknown>(table: string, options?: QueryOptions): Promise<T[]>;

  /** Return the single matching row, or null. */
  findOne<T = unknown>(table: string, options?: QueryOptions): Promise<T | null>;

  /** Insert one or many rows. Returns the inserted rows. */
  insert<T = unknown>(table: string, rows: Partial<T> | Partial<T>[]): Promise<T[]>;

  /** Update rows matching `where`. Returns the updated rows. */
  update<T = unknown>(table: string, patch: Partial<T>, where: Where): Promise<T[]>;

  /** Upsert by conflict target. */
  upsert<T = unknown>(
    table: string,
    rows: Partial<T> | Partial<T>[],
    options?: { onConflict?: string },
  ): Promise<T[]>;

  /** Delete rows matching `where`. */
  delete(table: string, where: Where): Promise<void>;

  /** Call a stored procedure / RPC by name. */
  rpc<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>;

  /** Count rows matching the optional where clause. */
  count(table: string, where?: Where): Promise<number>;
}