/**
 * File storage abstraction — agnostic of the underlying provider.
 *
 * Implementations live in `src/lib/data/adapters/*`. Swap providers
 * (Supabase Storage, S3, R2, local disk) by changing the adapter wired
 * up in `src/lib/data/provider.server.ts`.
 */

export interface UploadOptions {
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
}

export interface Storage {
  /** Upload bytes to `bucket/path`. */
  upload(
    bucket: string,
    path: string,
    data: ArrayBuffer | Blob | Uint8Array,
    options?: UploadOptions,
  ): Promise<{ path: string }>;

  /** Download bytes from `bucket/path`. */
  download(bucket: string, path: string): Promise<Blob>;

  /** Return a public URL (only works for public buckets). */
  getPublicUrl(bucket: string, path: string): string;

  /** Return a short-lived signed URL for private buckets. */
  getSignedUrl(bucket: string, path: string, options?: SignedUrlOptions): Promise<string>;

  /** Remove an object. */
  remove(bucket: string, path: string): Promise<void>;

  /** List objects under a path prefix. */
  list(bucket: string, prefix?: string): Promise<Array<{ name: string; size?: number; updatedAt?: string }>>;
}