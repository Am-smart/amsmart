import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCertificates } from '@/lib/api-actions';
import { CertificateCard } from '@/components/certificates';
import { EmptyState, Skeleton } from '@/components/ui-legacy';
import type { CertificateDTO } from '@/lib/types';

function StudentCertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getCertificates({ userId: user.id })
      .then(setCertificates)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load certificates'))
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">My Certificates</h1>
        <p className="text-sm text-muted-foreground">Download completion certificates for the courses you finished.</p>
      </header>

      {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete a course to earn your first certificate."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {certificates.map((c) => <CertificateCard key={c.id} certificate={c} />)}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/student/certificates')({
  head: () => ({ meta: [{ title: 'Student — Certificates — SmartLMS' }] }),
  component: StudentCertificatesPage,
});
