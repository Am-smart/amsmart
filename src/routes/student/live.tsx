import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getLiveClasses, recordAttendance } from '@/lib/api-actions';
import { LiveClassesList } from "@/components/communication/LiveClassesList";
import { LiveClassDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';

function LiveClassesPage() {
  const { addToast } = useAppContext();
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClassDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const enrollments = await getEnrollments(user.id);
        const courseIds = enrollments.map(e => e.course_id);
        if (courseIds.length > 0) {
            const data = await getLiveClasses();
            const filtered = data.filter(lc => courseIds.includes(lc.course_id));
            setLiveClasses(filtered);
        }
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && liveClasses.length > 0) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id && liveClasses.some(lc => lc.id === id)) {
            setTimeout(() => {
                const element = document.getElementById(`live-class-${id}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4');
                    setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500', 'ring-offset-4'), 3000);
                }
            }, 500);
        }
    }
  }, [loading, liveClasses]);

  return <LiveClassesList liveClasses={liveClasses} onJoin={async (lc) => {
      try {
          await recordAttendance(lc.id);
          if (lc.meeting_url) window.open(lc.meeting_url, '_blank');
      } catch (err) {
          console.error('Failed to record attendance:', err);
          addToast('Could not record attendance, but joining class...', 'info');
          if (lc.meeting_url) window.open(lc.meeting_url, '_blank');
      }
  }} />;
}


export const Route = createFileRoute('/student/live')({
  head: () => ({ meta: [{ title: "Student — Live — SmartLMS" }] }),
  component: LiveClassesPage,
});
