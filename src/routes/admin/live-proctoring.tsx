import { createFileRoute } from '@tanstack/react-router';
import { LiveProctoringPage } from '@/components/proctoring';

function AdminLiveProctoring() {
  return <LiveProctoringPage description="Real-time monitor of all proctored assessment sessions (refreshes every 5s)." />;
}

export const Route = createFileRoute('/admin/live-proctoring')({
  head: () => ({
    meta: [
      { title: 'Admin — Live Proctoring — SmartLMS' },
      { name: 'description', content: 'Monitor active proctored assessment sessions and integrity violations in real time.' },
    ],
  }),
  component: AdminLiveProctoring,
});
