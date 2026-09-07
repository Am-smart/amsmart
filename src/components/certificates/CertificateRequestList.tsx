import React from 'react';
import { Clock, Check, X, ShieldCheck } from 'lucide-react';
import type { CertificateRequestDTO } from '@/lib/types';
import { CertificateRequestDomain } from '@/lib/domain/certificate.domain';

const STATUS_STYLES: Record<CertificateRequestDTO['status'], string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  teacher_approved: 'bg-blue-500/10 text-blue-600',
  approved: 'bg-emerald-500/10 text-emerald-600',
  rejected: 'bg-destructive/10 text-destructive',
};

export const CertificateRequestStatusBadge: React.FC<{ status: CertificateRequestDTO['status'] }> = ({ status }) => (
  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
    {CertificateRequestDomain.statusLabel(status)}
  </span>
);

interface CertificateRequestListProps {
  requests: CertificateRequestDTO[];
  /** Show the student name (teacher/admin views). */
  showStudent?: boolean;
  /** Rendered for requests the viewer may act on. */
  renderActions?: (request: CertificateRequestDTO) => React.ReactNode;
}

export const CertificateRequestList: React.FC<CertificateRequestListProps> = ({
  requests,
  showStudent = false,
  renderActions,
}) => (
  <ul className="space-y-3">
    {requests.map((r) => (
      <li key={r.id} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{r.course_title || 'Course'}</h3>
            {showStudent && <p className="truncate text-sm text-muted-foreground">{r.student_name}</p>}
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={13} />
              Requested {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
            </p>
          </div>
          <CertificateRequestStatusBadge status={r.status} />
        </div>

        {r.message && (
          <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground">{r.message}</p>
        )}
        {r.teacher_note && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            <span>Instructor note: {r.teacher_note}</span>
          </p>
        )}
        {r.status === 'rejected' && r.decision_reason && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
            <X size={14} className="mt-0.5 shrink-0" />
            <span>{r.decision_reason}</span>
          </p>
        )}
        {r.status === 'approved' && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
            <Check size={14} />
            Certificate issued — find it in your certificates list.
          </p>
        )}

        {renderActions && <div className="mt-4 flex flex-wrap gap-2">{renderActions(r)}</div>}
      </li>
    ))}
  </ul>
);
