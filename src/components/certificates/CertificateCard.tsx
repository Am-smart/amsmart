import React from 'react';
import { Award, Download, ShieldOff, Trash2 } from 'lucide-react';
import type { CertificateDTO } from '@/lib/types';
import { downloadCertificatePdf } from './certificate-pdf';

interface CertificateCardProps {
  certificate: CertificateDTO;
  onRevoke?: (cert: CertificateDTO) => void;
  onDelete?: (cert: CertificateDTO) => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({ certificate, onRevoke, onDelete }) => {
  const [busy, setBusy] = React.useState(false);

  const handleDownload = async () => {
    setBusy(true);
    try {
      await downloadCertificatePdf(certificate);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={`rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        certificate.revoked ? 'border-destructive/40 opacity-75' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Award size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{certificate.course_title || 'Course'}</h3>
            <p className="truncate text-sm text-muted-foreground">{certificate.recipient_name}</p>
          </div>
        </div>
        {certificate.revoked && (
          <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
            Revoked
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Issued</dt>
          <dd className="font-medium text-foreground">
            {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString() : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Grade</dt>
          <dd className="font-medium text-foreground">
            {certificate.final_grade !== null ? `${certificate.final_grade}%` : '—'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Verification code</dt>
          <dd className="break-all font-mono text-xs font-medium text-foreground">{certificate.code}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy || certificate.revoked}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Download size={15} />
          {busy ? 'Preparing…' : 'Download PDF'}
        </button>
        {onRevoke && !certificate.revoked && (
          <button
            type="button"
            onClick={() => onRevoke(certificate)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ShieldOff size={15} />
            Revoke
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(certificate)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={15} />
            Delete
          </button>
        )}
      </div>
    </article>
  );
};
