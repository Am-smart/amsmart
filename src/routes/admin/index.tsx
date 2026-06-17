import { createFileRoute } from '@tanstack/react-router';

import React from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { useAppContext } from '@/components/AppContext';
import { StatCard } from '@/components/ui-legacy/StatCard';

function AdminDashboard() {
  const { user } = useAuth();
  const { stats, isDataLoading, refreshDashboardData } = useAppContext();

  if (!user) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">Admin Overview</h2>
          <button
            onClick={() => refreshDashboardData()}
            className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest"
          >
            Refresh
          </button>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 ${isDataLoading ? 'animate-pulse opacity-70' : ''}`}>
        <StatCard 
          label="Total Users" 
          value={stats.totalUsers || 0}
          subtext={`Teachers: ${stats.teachers || 0} | Students: ${stats.students || 0}`}
          color="blue"
        />
        <StatCard 
          label="Active Courses" 
          value={stats.activeCourses || 0}
          subtext="Live & Published"
          color="green"
        />
        <StatCard 
          label="Security Alerts" 
          value={stats.flaggedUsers || 0}
          subtext={`Flagged: ${stats.flaggedUsers || 0} | Pending Resets: ${stats.pendingResets || 0}`}
          color={(stats.flaggedUsers || 0) > 0 ? 'red' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 sm:mb-6">System Health</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="font-medium">Database Connection</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="font-medium">Storage Service</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="font-medium">Auth Service</span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Healthy</span>
                </div>
            </div>
        </div>
        <div className="bg-white p-4 sm:p-8 rounded-3xl shadow-sm border border-slate-100 overflow-x-auto">
            <h3 className="text-lg font-bold mb-4 sm:mb-6">Recent Activity Logs</h3>
            <div className="text-slate-500 text-sm italic">
                Logs are being recorded. Visit the System Logs page for detailed tracking.
            </div>
            <button
                onClick={() => window.location.href = '/admin/system'}
                className="mt-6 text-blue-600 font-bold text-sm hover:underline"
            >
                View All System Logs →
            </button>
        </div>
      </div>
    </div>
  );
}


export const Route = createFileRoute('/admin/')({
  head: () => ({ meta: [{ title: "Admin — SmartLMS" }] }),
  component: AdminDashboard,
});
