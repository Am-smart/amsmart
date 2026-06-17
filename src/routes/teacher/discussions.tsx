import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import * as actions from '@/lib/api-actions';
import { DiscussionBoard } from "@/components/communication/DiscussionBoard";
import { CourseDTO } from '@/lib/types';

function DiscussionsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  useEffect(() => {
    if (user && user.id) {
        actions.getCourses(user.id).then(c => {
            setCourses(c);
            if (c.length > 0) setSelectedCourseId(c[0].id);
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
                {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
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


export const Route = createFileRoute('/teacher/discussions')({
  head: () => ({ meta: [{ title: "Teacher — Discussions — SmartLMS" }] }),
  component: DiscussionsPage,
});
