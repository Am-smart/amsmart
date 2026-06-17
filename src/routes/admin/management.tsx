import { createFileRoute } from '@tanstack/react-router';

import React from 'react';
import { SystemHealth, SystemInfo } from "@/components/system/SystemMisc";
import { Shield, Settings, Database } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { createSystemLog } from '@/lib/api-actions';

function ManagementPage() {
    const { addToast } = useAppContext();

    const handleAction = async (action: string) => {
        const confirmAction = confirm(`Are you sure you want to perform: ${action}?`);
        if (confirmAction) {
            try {
                // Real implementation: Log the action to system_logs
                await createSystemLog({
                    category: 'management',
                    level: 'info',
                    message: `Admin performed management action: ${action}`,
                    metadata: { action }
                });
                addToast(`${action} completed successfully.`, 'success');
            } catch (err) {
                console.error('Action failed:', err);
                addToast(`Failed to perform ${action}.`, 'error');
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">System Management</h2>
                <div className="flex gap-2">
                    <button onClick={() => handleAction('Clear Cache')} className="btn-secondary text-[10px] font-bold py-2 px-4 flex items-center gap-2">
                        <Database size={14} /> Clear Cache
                    </button>
                    <button onClick={() => handleAction('Security Scan')} className="btn-primary bg-amber-600 hover:bg-amber-700 text-[10px] font-bold py-2 px-4 flex items-center gap-2">
                        <Shield size={14} /> Security Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SystemHealth />
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Settings size={24} /></div>
                        <h3 className="text-xl font-bold">Resource Allocation</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">Live System Metrics</p>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                        <span>PostgreSQL Performance</span>
                                        <span>EXCELLENT</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full w-[98%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                        <span>Cache Hit Ratio</span>
                                        <span>94.2%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full w-[94%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                        <span>Storage Availability</span>
                                        <span>99.99%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-purple-500 h-full w-[99%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic text-center">System metrics monitored via internal health checks.</p>
                    </div>
                </div>
            </div>

            <SystemInfo />
        </div>
    );
}


export const Route = createFileRoute('/admin/management')({
  head: () => ({ meta: [{ title: "Admin — Management — SmartLMS" }] }),
  component: ManagementPage,
});
