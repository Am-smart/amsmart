import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getAssignments, getQuizzes, getLiveClasses } from '@/lib/api-actions';
import { CalendarView } from "@/components/ui-legacy/CalendarView";
import { AssignmentDTO, QuizDTO, LiveClassDTO } from '@/lib/types';

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
        getCourses(user.id).then(async myCourses => {
            const courseIds = myCourses.map(c => c.id);
            if (courseIds.length === 0) return;

            const [assignments, quizzes, liveClasses] = await Promise.all([
                getAssignments(user.id),
                getQuizzes(undefined, user.id),
                getLiveClasses(undefined, user.id)
            ]);

            const mappedEvents: CalendarEvent[] = [];

            // Assignments
            assignments.forEach((a: AssignmentDTO) => {
                mappedEvents.push({
                    id: a.id,
                    title: `Due: ${a.title}`,
                    date: a.due_date.split('T')[0],
                    type: 'assignment' as const,
                    color: 'bg-blue-50 text-blue-600 border-blue-500'
                });
            });

            // Quizzes
            quizzes.forEach((q: QuizDTO) => {
                mappedEvents.push({
                    id: q.id,
                    title: `Quiz: ${q.title}`,
                    date: (q.start_at || q.end_at || '').split('T')[0],
                    type: 'quiz' as const,
                    color: 'bg-purple-50 text-purple-600 border-purple-500'
                });
            });

            // Live Classes with Recurring Logic
            liveClasses.forEach((l: LiveClassDTO) => {
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


export const Route = createFileRoute('/teacher/calendar')({
  head: () => ({ meta: [{ title: "Teacher — Calendar — SmartLMS" }] }),
  component: CalendarPage,
});
