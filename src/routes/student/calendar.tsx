import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getAssignments, getQuizzes, getLiveClasses, getEnrollments, getSubmissions } from '@/lib/api-actions';
import { CalendarView } from "@/components/ui/CalendarView";
import { AssignmentDTO, QuizDTO, LiveClassDTO, SubmissionDTO } from '@/lib/types';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    type: 'assignment' | 'quiz' | 'live';
    color: string;
}

function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (user && user.id) {
        getEnrollments(user.id).then(async enrollments => {
            const courseIds = enrollments.map(e => e.course_id);
            if (courseIds.length === 0) return;

            const [assignments, quizzes, liveClasses, submissions] = await Promise.all([
                getAssignments(undefined, undefined),
                getQuizzes(undefined, undefined),
                getLiveClasses(),
                getSubmissions({ studentId: user.id })
            ]);

            const mappedEvents: CalendarEvent[] = [];

            // Assignments
            assignments.filter(a => courseIds.includes(a.course_id)).forEach((a: AssignmentDTO) => {
                const submission = submissions.find((s: SubmissionDTO) => s.assignment_id === a.id);
                const isGraded = submission?.status === 'graded';

                mappedEvents.push({
                    id: a.id,
                    title: `${isGraded ? 'Graded: ' : 'Due: '}${a.title}`,
                    date: a.due_date.split('T')[0],
                    type: 'assignment' as const,
                    color: isGraded ? 'bg-slate-50 text-slate-400 border-slate-300' : 'bg-blue-50 text-blue-600 border-blue-500'
                });
            });

            // Quizzes
            quizzes.filter(q => courseIds.includes(q.course_id)).forEach((q: QuizDTO) => {
                mappedEvents.push({
                    id: q.id,
                    title: `Quiz: ${q.title}`,
                    date: (q.start_at || q.end_at || '').split('T')[0],
                    type: 'quiz' as const,
                    color: 'bg-purple-50 text-purple-600 border-purple-500'
                });
            });

            // Live Classes with Recurring Logic
            liveClasses.filter(l => courseIds.includes(l.course_id)).forEach((l: LiveClassDTO) => {
                // Initial instance
                mappedEvents.push({
                    id: l.id,
                    title: `Class: ${l.title}`,
                    date: l.start_at.split('T')[0],
                    type: 'live' as const,
                    color: 'bg-green-50 text-green-600 border-green-500'
                });

                // Handle simple weekly recurrence for the next 4 weeks
                if (l.recurring_config && (l.recurring_config as Record<string, string | number | boolean>).frequency === 'weekly') {
                    const startDate = new Date(l.start_at);
                    for (let i = 1; i <= 4; i++) {
                        const nextDate = new Date(startDate);
                        nextDate.setDate(startDate.getDate() + (i * 7));
                        mappedEvents.push({
                            id: `${l.id}-rec-${i}`,
                            title: `Class: ${l.title} (Recurring)`,
                            date: nextDate.toISOString().split('T')[0],
                            type: 'live' as const,
                            color: 'bg-green-50/50 text-green-500 border-green-300'
                        });
                    }
                }
            });

            setEvents(mappedEvents);
        });
    }
  }, [user]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-6">Academic Calendar</h2>
        <CalendarView events={events} />
    </div>
  );
}


export const Route = createFileRoute('/student/calendar')({
  head: () => ({ meta: [{ title: "Student — Calendar — SmartLMS" }] }),
  component: CalendarPage,
});
