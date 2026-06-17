import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { DiscussionBoard } from "@/components/communication/DiscussionBoard";
import { EnrollmentDTO } from '@/lib/types';
import { getEnrollments } from '@/lib/api-actions';

function DiscussionsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  useEffect(() => {
    if (user && user.id) {
        getEnrollments(user.id).then(e => {
            setEnrollments(e);

            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (id && e.some(item => item.course_id === id)) {
                setSelectedCourseId(id);
            } else if (e.length > 0) {
                setSelectedCourseId(e[0].course_id);
            }
        });
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Select Course Discussion</label>
            <select
                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
            >
                <option value="">Global Discussion</option>
                {enrollments.map(e => (
                    <option key={e.course_id} value={e.course_id}>{e.course?.title}</option>
                ))}
            </select>
        </div>

        <DiscussionBoard
            courseId={selectedCourseId || undefined}
            userId={user.id}
        />
    </div>
  );
}


export const Route = createFileRoute('/student/discussions')({
  head: () => ({ meta: [{ title: "Student — Discussions — SmartLMS" }] }),
  component: DiscussionsPage,
});
