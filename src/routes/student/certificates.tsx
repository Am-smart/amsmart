import { createFileRoute } from '@tanstack/react-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, FileCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import {
  getCertificates,
  getCertificateRequests,
  getEnrollments,
  requestCertificate,
} from '@/lib/api-actions';
import { CertificateCard, CertificateRequestList } from '@/components/certificates';
import { EmptyState, Skeleton } from '@/components/ui-legacy';
import type { CertificateDTO, CertificateRequestDTO, EnrollmentDTO } from '@/lib/types';

function StudentCertificatesPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [requests, setRequests] = useState<CertificateRequestDTO[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [courseId, setCourseId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    Promise.all([
      getCertificates({ userId: user.id }),
      getCertificateRequests({ userId: user.id }),
      getEnrollments(user.id),
    ])
      .then(([certs, reqs, enrolls]) => {
        setCertificates(certs);
        setRequests(reqs);
        setEnrollments(enrolls);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load certificates'))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const requestableCourses = useMemo(() => {
    const blocked = new Set([
      ...certificates.filter((c) => !c.revoked).map((c) => c.course_id),
      ...requests.filter((r) => r.status !== 'rejected').map((r) => r.course_id),
    ]);
    return enrollments
      .filter((e) => !blocked.has(e.course_id))
      .map((e) => ({ id: e.course_id, title: e.course?.title || 'Course' }));
  }, [enrollments, certificates, requests]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setIsSubmitting(true);
    const res = await requestCertificate(courseId, message.trim() || undefined);
    setIsSubmitting(false);
    if (res.success) {
      addToast('Certificate request submitted', 'success');
      setCourseId('');
      setMessage('');
      load();
    } else {
      addToast(res.error || 'Failed to submit request', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Apply for a certificate when you finish a course, then download it once it is approved.
        </p>
      </header>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <form onSubmit={handleApply} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Course</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2"
            required
          >
            <option value="">Select a course…</option>
            {requestableCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-foreground">Note for your instructor (optional)</span>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Anything the reviewer should know"
            className="rounded-lg border border-border bg-background px-3 py-2"
            maxLength={1000}
          />
        </label>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting || !courseId}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Request certificate'}
          </button>
          {!isLoading && requestableCourses.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              No courses available to request right now.
            </p>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">My requests</h2>
        {isLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : requests.length === 0 ? (
          <EmptyState icon={FileCheck} title="No requests yet" description="Request a certificate for a course you completed." />
        ) : (
          <CertificateRequestList requests={requests} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Issued certificates</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Complete a course and get approved to earn your first certificate."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {certificates.map((c) => <CertificateCard key={c.id} certificate={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export const Route = createFileRoute('/student/certificates')({
  head: () => ({ meta: [{ title: 'Student — Certificates — SmartLMS' }] }),
  component: StudentCertificatesPage,
});
