import { createFileRoute } from '@tanstack/react-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Palette, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import {
  getCertificates,
  getCertificateRequests,
  decideCertificateRequest,
  revokeCertificate,
  deleteCertificate,
  getCertificateTemplates,
  saveCertificateTemplates,
} from '@/lib/api-actions';
import { CertificateCard, CertificateRequestList } from '@/components/certificates';
import { CertificateTemplatePreview } from '@/components/certificates/CertificateTemplatePreview';
import { EmptyState, Skeleton } from '@/components/ui-legacy';
import type { CertificateDTO, CertificateRequestDTO, CertificateTemplate } from '@/lib/types';

function AdminCertificatesPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [requests, setRequests] = useState<CertificateRequestDTO[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [templateChoice, setTemplateChoice] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    Promise.all([getCertificates({}), getCertificateRequests({}), getCertificateTemplates()])
      .then(([certs, reqs, tpls]) => {
        setCertificates(certs);
        setRequests(reqs);
        setTemplates(tpls);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load certificates'))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const openRequests = useMemo(
    () => requests.filter((r) => r.status === 'pending' || r.status === 'teacher_approved'),
    [requests]
  );
  const closedRequests = useMemo(
    () => requests.filter((r) => r.status === 'approved' || r.status === 'rejected'),
    [requests]
  );
  const defaultTemplateId = useMemo(
    () => templates.find((t) => t.is_default)?.id || templates[0]?.id || 'default',
    [templates]
  );

  const handleDecide = async (request: CertificateRequestDTO, decision: 'approved' | 'rejected') => {
    let reason = '';
    if (decision === 'rejected') {
      reason = window.prompt('Reason for declining (shared with the student):') || '';
      if (!reason.trim()) return;
    }
    setBusyId(request.id);
    const res = await decideCertificateRequest(request.id, decision, {
      reason: reason.trim() || undefined,
      template: decision === 'approved' ? (templateChoice[request.id] || defaultTemplateId) : undefined,
    });
    setBusyId(null);
    if (res.success) {
      addToast(decision === 'approved' ? 'Certificate approved and issued' : 'Request declined', 'success');
      load();
    } else {
      addToast(res.error || 'Failed to update request', 'error');
    }
  };

  const handleRevoke = async (cert: CertificateDTO) => {
    const reason = window.prompt(
      `Revoke the certificate for ${cert.recipient_name || 'this student'} (${cert.code})?\n\nThis reason will be shown publicly on the verification page:`,
      'Revoked by administrator'
    );
    if (reason === null) return;
    const trimmed = reason.trim().slice(0, 300);
    if (!trimmed) { addToast('A revocation reason is required', 'error'); return; }
    const res = await revokeCertificate(cert.id, trimmed);
    if (res.success) { addToast('Certificate revoked', 'success'); load(); }
    else addToast(res.error || 'Failed to revoke certificate', 'error');
  };

  const handleDelete = async (cert: CertificateDTO) => {
    if (!window.confirm(`Delete the certificate for ${cert.recipient_name || 'this student'}?`)) return;
    const res = await deleteCertificate(cert.id);
    if (res.success) { addToast('Certificate deleted', 'success'); load(); }
    else addToast(res.error || 'Failed to delete certificate', 'error');
  };

  const updateTemplate = (index: number, patch: Partial<CertificateTemplate>) => {
    setTemplates((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  };

  const handleSaveTemplates = async () => {
    setIsSavingTemplates(true);
    const res = await saveCertificateTemplates(templates);
    setIsSavingTemplates(false);
    if (res.success) { addToast('Templates saved', 'success'); if (res.data) setTemplates(res.data); }
    else addToast(res.error || 'Failed to save templates', 'error');
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Approve certificate requests, manage issued certificates, and edit certificate templates.
        </p>
      </header>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Awaiting approval{openRequests.length ? ` (${openRequests.length})` : ''}
        </h2>
        {isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : openRequests.length === 0 ? (
          <EmptyState icon={Award} title="Nothing to approve" description="Approved requests will appear once instructors review them." />
        ) : (
          <CertificateRequestList
            requests={openRequests}
            showStudent
            renderActions={(r) => (
              <>
                <select
                  value={templateChoice[r.id] || defaultTemplateId}
                  onChange={(e) => setTemplateChoice((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  aria-label="Certificate template"
                >
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => handleDecide(r, 'approved')}
                  disabled={busyId === r.id}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Approve &amp; issue
                </button>
                <button
                  type="button"
                  onClick={() => handleDecide(r, 'rejected')}
                  disabled={busyId === r.id}
                  className="rounded-lg border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  Decline
                </button>
              </>
            )}
          />
        )}
      </section>

      {!isLoading && closedRequests.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Decided requests</h2>
          <CertificateRequestList requests={closedRequests} showStudent />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Palette size={18} /> Certificate templates
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setTemplates((prev) => [
                  ...prev,
                  {
                    id: `template-${prev.length + 1}`,
                    name: 'New template',
                    title: 'Certificate of Completion',
                    accent: '#1e40af',
                    body: 'has successfully completed',
                  },
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <Plus size={15} /> Add template
            </button>
            <button
              type="button"
              onClick={handleSaveTemplates}
              disabled={isSavingTemplates || templates.length === 0}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isSavingTemplates ? 'Saving…' : 'Save templates'}
            </button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((t, index) => (
              <div key={`${t.id}-${index}`} className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">Name</span>
                    <input
                      value={t.name}
                      onChange={(e) => updateTemplate(index, { name: e.target.value })}
                      className="rounded-lg border border-border bg-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">Identifier</span>
                    <input
                      value={t.id}
                      onChange={(e) => updateTemplate(index, { id: e.target.value })}
                      className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Headline</span>
                  <input
                    value={t.title}
                    onChange={(e) => updateTemplate(index, { title: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">Body line</span>
                  <input
                    value={t.body}
                    onChange={(e) => updateTemplate(index, { body: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">Accent</span>
                    <input
                      type="color"
                      value={t.accent}
                      onChange={(e) => updateTemplate(index, { accent: e.target.value })}
                      className="h-8 w-12 rounded border border-border bg-background"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name="default-template"
                      checked={!!t.is_default}
                      onChange={() =>
                        setTemplates((prev) => prev.map((p, i) => ({ ...p, is_default: i === index })))
                      }
                    />
                    Default
                  </label>
                  <button
                    type="button"
                    onClick={() => setTemplates((prev) => prev.filter((_, i) => i !== index))}
                    disabled={templates.length <= 1}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
                <CertificateTemplatePreview template={t} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Issued certificates</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState icon={Award} title="No certificates issued" description="Approve a request to issue the first certificate." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {certificates.map((c) => (
              <CertificateCard key={c.id} certificate={c} onRevoke={handleRevoke} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export const Route = createFileRoute('/admin/certificates')({
  head: () => ({ meta: [
    { title: 'Admin — Certificates — SmartLMS' },
    { name: 'description', content: 'Manage SmartLMS certificate requests, issued certificates, and templates with live PDF previews.' },
    { property: 'og:title', content: 'Certificate Management — SmartLMS' },
    { property: 'og:description', content: 'Review certificate requests and preview template colours and wording before issuance.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: AdminCertificatesPage,
});
