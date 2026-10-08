import React, { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CertificateDTO, CertificateTemplate } from '@/lib/types';
import { renderCertificatePdf } from './certificate-pdf';

/** Preview uses the issuance renderer, never a parallel HTML approximation. */
export function CertificateTemplatePreview({ template }: { template: CertificateTemplate }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    let destroyDocument: (() => void) | undefined;
    let cancelRender: (() => void) | undefined;
    setBusy(true);
    setError(null);
    setPdfUrl(null);

    const timer = window.setTimeout(async () => {
      try {
        const sample: CertificateDTO = {
          id: 'preview', user_id: 'preview', course_id: 'preview',
          code: 'SAMPLE-PREVIEW', title: template.title,
          recipient_name: 'Sample Student', course_title: 'Sample Course',
          final_grade: 95, template: template.id, template_name: template.name,
          template_accent: template.accent, template_body: template.body,
          branding: template,
          pdf_url: null, issued_at: '2026-01-15T12:00:00Z',
          revoked: false, revoked_reason: null,
        };
        const doc = await renderCertificatePdf(sample);
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const { default: workerUrl } = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        const loading = pdfjs.getDocument({ data: doc.output('arraybuffer') });
        destroyDocument = () => { void loading.destroy(); };
        const pdf = await loading.promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: 1.5 });
        // Render offscreen so edits never expose a partially painted page.
        const buffer = document.createElement('canvas');
        buffer.width = Math.ceil(viewport.width);
        buffer.height = Math.ceil(viewport.height);
        const context = buffer.getContext('2d');
        if (!context) throw new Error('PDF preview is unavailable in this browser.');
        const task = page.render({ canvas: buffer, canvasContext: context, viewport });
        cancelRender = () => task.cancel();
        await task.promise;
        const canvas = canvasRef.current;
        if (cancelled || !canvas) return;
        canvas.width = buffer.width;
        canvas.height = buffer.height;
        canvas.getContext('2d')?.drawImage(buffer, 0, 0);
        url = URL.createObjectURL(doc.output('blob'));
        setPdfUrl(url);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load PDF preview.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelRender?.();
      destroyDocument?.();
      if (url) URL.revokeObjectURL(url);
    };
  }, [template.id, template.name, template.title, template.accent, template.body, retry]);

  return (
    <div className="min-w-0 space-y-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">Live PDF preview <span className="font-normal text-muted-foreground">· Sample</span></h3>
        <div className="flex items-center gap-1">
          {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground motion-reduce:animate-none" aria-label="Updating PDF preview" />}
          <Button variant="ghost" size="icon" disabled={!pdfUrl || busy} asChild={!!pdfUrl} title="Open sample PDF" aria-label="Open sample PDF">
            {pdfUrl ? <a href={pdfUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /></a> : <ExternalLink />}
          </Button>
          <Button variant="ghost" size="icon" disabled={!pdfUrl || busy} asChild={!!pdfUrl} title="Download sample PDF" aria-label="Download sample PDF">
            {pdfUrl ? <a href={pdfUrl} download="certificate-template-sample.pdf"><Download /></a> : <Download />}
          </Button>
        </div>
      </div>
      <div className="relative aspect-[842/595] overflow-hidden rounded-md border border-border bg-muted" aria-busy={busy}>
        <canvas ref={canvasRef} className="block h-full w-full" role="img" aria-label={`Sample certificate: ${template.title}. Sample Student ${template.body} Sample Course.`} />
        {!pdfUrl && busy && <div className="absolute inset-0 flex items-center justify-center bg-muted text-sm text-muted-foreground" role="status">Preparing preview…</div>}
        {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-4 text-center" role="alert">
          <p className="text-sm text-destructive" title={error}>Unable to display the PDF preview.</p>
          <Button variant="outline" size="sm" onClick={() => setRetry((value) => value + 1)}><RefreshCw />Retry</Button>
        </div>}
      </div>
    </div>
  );
}