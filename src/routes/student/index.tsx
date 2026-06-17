import { createFileRoute } from '@tanstack/react-router';

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { EmptyState } from '@/components/ui-legacy/EmptyState';
import { BookOpen, FileText } from 'lucide-react';
import { useRouter } from '@/lib/next-compat';

function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { enrollments, assignments, stats, isDataLoading } = useAppContext();

  if (!user) return null;

  if (isDataLoading && enrollments.length === 0) {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-64 bg-slate-100 rounded-3xl"></div>
            <div className="h-8 w-64 bg-slate-100 rounded-xl"></div>
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
    <ErrorBoundary>
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Welcome Back, {user.full_name}!</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Enrolled Courses</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.courses}</div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h4 className="text-slate-500 text-sm font-bold uppercase mb-2">Upcoming Assignments</h4>
          <div className="text-3xl font-bold text-slate-900">{stats.dueSoon}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4 sm:mb-6">Continue Learning</h3>
              {enrollments.length > 0 ? (
                  <div className="space-y-4 min-w-[300px]">
                      {enrollments.slice(0, 3).map(e => (
                          <div key={e.course_id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl">📖</div>
                              <div className="flex-1">
                                  <div className="font-bold text-slate-900">{e.course?.title}</div>
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                      <div className="bg-blue-500 h-full" style={{ width: `${e.progress || 0}%` }}></div>
                                  </div>
                              </div>
                              <button
                                onClick={() => router.push(`/student/courses?id=${e.course_id}`)}
                                className="text-blue-600 font-bold text-xs uppercase"
                              >
                                Open
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No Courses Enrolled"
                    description="You haven't enrolled in any courses yet. Check out the catalog to get started!"
                    action={{
                        label: "Browse Catalog",
                        onClick: () => router.push('/student/courses')
                    }}
                  />
              )}
          </div>

          <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
              <h3 className="text-lg font-bold mb-4 sm:mb-6">Upcoming Deadlines</h3>
              {assignments.length > 0 ? (
                  <div className="space-y-4 min-w-[300px]">
                      {assignments.slice(0, 3).map(a => (
                          <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                  <div className="font-bold text-slate-900">{a.title}</div>
                                  <div className="text-xs text-slate-500 mt-1">Due: {new Date(a.due_date).toLocaleDateString()}</div>
                              </div>
                              <button
                                onClick={() => router.push(`/student/assignments?id=${a.id}`)}
                                className="btn-primary py-1.5 px-4 text-[10px]"
                              >
                                Submit
                              </button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <EmptyState
                    icon={FileText}
                    title="No Pending Assignments"
                    description="You're all caught up! No assignments are due at this time."
                  />
              )}
          </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}


export const Route = createFileRoute('/student/')({
  head: () => ({ meta: [{ title: "Student — SmartLMS" }] }),
  component: StudentDashboard,
});
