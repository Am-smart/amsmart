import { createFileRoute } from '@tanstack/react-router';
import { LiveProctoringPage } from '@/components/proctoring';

function TeacherLiveProctoring() {
  return <LiveProctoringPage description="Live sessions for your own quizzes and assignments (refreshes every 5s)." />;
}

export const Route = createFileRoute('/teacher/live-proctoring')({
  head: () => ({
    meta: [
      { title: 'Teacher — Live Proctoring — SmartLMS' },
      { name: 'description', content: 'Watch your students’ proctored assessments and integrity alerts as they happen.' },
    ],
  }),
  component: TeacherLiveProctoring,
});
