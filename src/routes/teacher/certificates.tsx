import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import {
  getCertificates,
  issueCertificate,
  revokeCertificate,
  getEnrollments,
  getUsers,
} from '@/lib/api-actions';
import { CertificateCard } from '@/components/certificates';
import { EmptyState, Skeleton } from '@/components/ui-legacy';
import type { CertificateDTO, EnrollmentDTO, UserDTO } from '@/lib/types';

function TeacherCertificatesPage() {
  const { user } = useAuth();
  const { courses, addToast } = useAppContext();
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [students, setStudents] = useState<UserDTO[]>([]);
  const [courseId, setCourseId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isIssuing, setIsIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    Promise.all([getCertificates({}), getUsers({ role: 'student' })])
      .then(([certs, list]) => {
        setCertificates(certs);
        setStudents(list);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load certificates'))
      .finally(() => setIsLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!courseId) { setEnrollments([]); return; }
    getEnrollments(courseId).then(setEnrollments).catch(() => setEnrollments([]));
  }, [courseId]);

  const eligibleStudents = useMemo(() => {
    if (!courseId) return [];
    const enrolledIds = new Set(enrollments.map((e) => e.student_id));
    return students.filter((s) => enrolledIds.has(s.id));
  }, [courseId, enrollments, students]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !studentId) return;
    setIsIssuing(true);
    const res = await issueCertificate({
      user_id: studentId,
      course_id: courseId,
      final_grade: grade === '' ? null : Number(grade),
    });
    setIsIssuing(false);
    if (res.success) {
      addToast('Certificate issued', 'success');
      setStudentId('');
      setGrade('');
      load();
    } else {
      addToast(res.error || 'Failed to issue certificate', 'error');
    }
  };

  const handleRevoke = async (cert: CertificateDTO) => {
    const res = await revokeCertificate(cert.id, 'Revoked by instructor');
    if (res.success) {
      addToast('Certificate revoked', 'success');
      load();
    } else {
      addToast(res.error || 'Failed to revoke certificate', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
        <p className="text-sm text-muted-foreground">Issue and manage completion certificates for your students.</p>
      </header>

      <form onSubmit={handleIssue} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-foreground">Course</span>
          <select
            value={courseId}
            onChange={(e) => { setCourseId(e.target.value); setStudentId(''); }}
            className="rounded-lg border border-border bg-background px-3 py-2"
            required
          >
            <option value="">Select a course…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Student</span>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2"
            disabled={!courseId}
            required
          >
            <option value="">Select a student…</option>
            {eligibleStudents.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">Final grade (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Optional"
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        <div className="sm:col-span-4">
          <button
            type="submit"
            disabled={isIssuing || !courseId || !studentId}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isIssuing ? 'Issuing…' : 'Issue certificate'}
          </button>
        </div>
      </form>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState icon={Award} title="No certificates issued" description="Issue your first certificate above." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((c) => (
            <CertificateCard key={c.id} certificate={c} onRevoke={handleRevoke} />
          ))}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/teacher/certificates')({
  head: () => ({ meta: [{ title: 'Teacher — Certificates — SmartLMS' }] }),
  component: TeacherCertificatesPage,
});
