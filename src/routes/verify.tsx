import { createFileRoute, Link } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { BadgeCheck, ShieldAlert, Search } from 'lucide-react';
import { verifyCertificate } from '@/lib/api-actions';

type Result = Awaited<ReturnType<typeof verifyCertificate>>;

function VerifyPage() {
  const { code: initial } = Route.useSearch();
  const [code, setCode] = useState(initial ?? '');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await verifyCertificate(value.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (initial) run(initial); }, [initial]);

  const valid = result?.found && result.valid && !result.revoked;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4 py-12">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Verify a certificate</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the verification code printed on a SmartLMS certificate.
        </p>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); run(code); }}
        className="flex gap-2"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SLMS-XXXX-XXXX-XXXX"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
          aria-label="Verification code"
          maxLength={64}
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Search size={15} /> {loading ? 'Checking…' : 'Verify'}
        </button>
      </form>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {result && !result.found && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-card p-5">
          <ShieldAlert className="shrink-0 text-destructive" />
          <p className="text-sm text-foreground">No certificate matches this code.</p>
        </div>
      )}

      {result?.found && (
        <article className={`rounded-xl border bg-card p-6 ${valid ? 'border-primary/40' : 'border-destructive/40'}`}>
          <div className="flex items-center gap-2">
            {valid ? <BadgeCheck className="text-primary" /> : <ShieldAlert className="text-destructive" />}
            <span className={`text-sm font-semibold ${valid ? 'text-primary' : 'text-destructive'}`}>
              {valid ? 'Verified certificate' : 'This certificate has been revoked'}
            </span>
          </div>
          <h2 className="mt-4 text-xl font-bold text-foreground">{result.title}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Awarded to</dt><dd className="font-medium text-foreground">{result.recipient_name || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Course</dt><dd className="font-medium text-foreground">{result.course_title || '—'}</dd></div>
            <div><dt className="text-muted-foreground">Issued</dt><dd className="font-medium text-foreground">{result.issued_at ? new Date(result.issued_at).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-muted-foreground">Code</dt><dd className="break-all font-mono text-xs text-foreground">{result.code}</dd></div>
          </dl>
        </article>
      )}

      <Link to="/" className="text-center text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
    </main>
  );
}

export const Route = createFileRoute('/verify')({
  validateSearch: (search: Record<string, unknown>): { code?: string } => ({
    code: typeof search.code === 'string' ? search.code.slice(0, 64) : undefined,
  }),
  head: () => ({
    meta: [
      { title: 'Verify a Certificate — SmartLMS' },
      { name: 'description', content: 'Check that a SmartLMS course completion certificate is genuine using its verification code.' },
      { property: 'og:title', content: 'Verify a Certificate — SmartLMS' },
      { property: 'og:description', content: 'Check that a SmartLMS certificate is genuine using its verification code.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: VerifyPage,
});
