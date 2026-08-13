/**
 * Durable-ish evidence uploader.
 *
 * Snapshots and media chunks are uploaded through the versioned upload
 * endpoint (never straight to a storage provider), one at a time, with
 * exponential backoff, an offline gate and a bounded queue so a long or
 * flaky session can never exhaust browser memory.
 */

export interface EvidenceItem {
  path: string;
  blob: Blob;
  contentType: string;
  attempts: number;
}

export interface EvidenceQueueOptions {
  category?: string;
  maxItems?: number;
  maxAttempts?: number;
  onUploaded?: (path: string, url: string | null) => void;
  onDropped?: (item: EvidenceItem, reason: string) => void;
}

const UPLOAD_URL = '/api/v1/system/upload';

export class EvidenceQueue {
  private queue: EvidenceItem[] = [];
  private running = false;
  private stopped = false;
  private failed = 0;

  private readonly category: string;
  private readonly maxItems: number;
  private readonly maxAttempts: number;

  constructor(private readonly options: EvidenceQueueOptions = {}) {
    this.category = options.category ?? 'proctoring-evidence';
    this.maxItems = options.maxItems ?? 60;
    this.maxAttempts = options.maxAttempts ?? 4;
  }

  get size(): number {
    return this.queue.length;
  }

  get failures(): number {
    return this.failed;
  }

  add(name: string, blob: Blob, contentType: string): void {
    if (this.stopped) return;
    if (this.queue.length >= this.maxItems) {
      const dropped = this.queue.shift();
      if (dropped) this.options.onDropped?.(dropped, 'queue_full');
    }
    this.queue.push({ path: name, blob, contentType, attempts: 0 });
    void this.drain();
  }

  async drain(): Promise<void> {
    if (this.running || this.stopped) return;
    this.running = true;
    try {
      while (this.queue.length > 0 && !this.stopped) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) break;
        const item = this.queue[0]!;
        try {
          const url = await this.upload(item);
          this.queue.shift();
          this.options.onUploaded?.(item.path, url);
        } catch {
          item.attempts += 1;
          if (item.attempts >= this.maxAttempts) {
            this.queue.shift();
            this.failed += 1;
            this.options.onDropped?.(item, 'max_attempts');
            continue;
          }
          await sleep(Math.min(8_000, 500 * 2 ** item.attempts));
        }
      }
    } finally {
      this.running = false;
    }
  }

  /** Best-effort flush used on stop; never rejects. */
  async flush(timeoutMs = 15_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (this.queue.length > 0 && Date.now() < deadline && !this.stopped) {
      await this.drain();
      if (this.queue.length > 0) await sleep(500);
    }
  }

  dispose(): void {
    this.stopped = true;
    this.queue = [];
  }

  private async upload(item: EvidenceItem): Promise<string | null> {
    const form = new FormData();
    form.append('file', new File([item.blob], item.path, { type: item.contentType }));
    form.append('category', this.category);

    const res = await fetch(UPLOAD_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: form,
    });
    if (!res.ok) throw new Error(`Evidence upload failed (${res.status})`);
    const json = (await res.json().catch(() => ({}))) as {
      data?: { publicUrl?: string; filePath?: string };
      publicUrl?: string;
    };
    return json.data?.publicUrl ?? json.publicUrl ?? null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
