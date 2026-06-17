import { createFileRoute } from '@tanstack/react-router';

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import { StatCard } from '@/components/ui-legacy/StatCard';
import { EmptyState } from '@/components/ui-legacy/EmptyState';
import { BookOpen, CheckSquare } from 'lucide-react';
import { useRouter } from '@/lib/next-compat';

function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { courses, submissions, stats, isDataLoading, refreshDashboardData } = useAppContext();

  if (!user) return null;

  if (isDataLoading && courses.length === 0) {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-8 w-64 bg-slate-100 rounded-xl mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[1,2].map(i => <div key={i} className="h-80 bg-slate-100 rounded-2xl"></div>)}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">Teacher Dashboard</h2>
          <button
            onClick={() => refreshDashboardData()}
            className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest"
          >
            Refresh
          </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard label="Your Courses" value={stats.courses} color="blue" />
        <StatCard label="Pending Grading" value={stats.pendingGrading || 0} color="amber" />
        <StatCard label="Active Live Classes" value={stats.liveClasses || 0} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4 sm:mb-6">Recent Courses</h3>
              {courses.length > 0 ? (
                  <div className="space-y-4 min-w-[300px]">
                      {courses.slice(0, 3).map(course => (
                          <div key={course.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                                      {course.thumbnail_url && course.thumbnail_url.length < 4 ? course.thumbnail_url : '📚'}
                                  </div>
                                  <div>
                                      <div className="font-bold text-slate-900">{course.title}</div>
                                  </div>
                              </div>
                              <button
                                onClick={() => router.push(`/teacher/courses?id=${course.id}`)}
                                className="text-blue-600 text-xs font-bold uppercase hover:underline"
                              >
                                Manage
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No Courses Yet"
                    description="You haven't created any courses yet. Start by creating your first course."
                    action={{
                        label: "Create Course",
                        onClick: () => router.push('/teacher/courses')
                    }}
                  />
              )}
          </div>
          <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4 sm:mb-6">Grading Tasks</h3>
              {submissions.length > 0 ? (
                  <div className="space-y-4 min-w-[300px]">
                      {submissions.slice(0, 3).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                  <div className="font-bold text-slate-900">{sub.student?.full_name || 'Student'}</div>
                                  <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold">
                                      {sub.assignment?.title || 'Assignment'}
                                  </div>
                              </div>
                              <button
                                onClick={() => router.push(`/teacher/grading?id=${sub.id}`)}
                                className="btn-primary py-1.5 px-4 text-[10px]"
                              >
                                Grade
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <EmptyState
                    icon={CheckSquare}
                    title="All Caught Up"
                    description="There are no submissions waiting for your review."
                  />
              )}
          </div>
      </div>
    </div>
  );
}


export const Route = createFileRoute('/teacher/')({
  head: () => ({ meta: [{ title: "Teacher — SmartLMS" }] }),
  component: TeacherDashboard,
});
