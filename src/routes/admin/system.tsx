import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { getSystemLogs } from '@/lib/api-actions';
import { SystemInfo } from "@/components/system/SystemMisc";
import { exportToCSV, exportToPDF } from '@/lib/report-utils';
import { FileSpreadsheet, FileText } from 'lucide-react';

function SystemPage() {
  const [logs, setLogs] = useState<{id: string, created_at: string, message: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getSystemLogs(50)
      .then(data => setLogs((data as Array<{id: string, created_at: string, message: string}>) || []))
      .catch(err => {
        console.error('Failed to load system logs:', err);
        setError('Failed to load system logs');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="animate-pulse">Loading system info...</div>;

  const handleExportLogsCSV = () => {
    const data = logs.map(log => ({
      Timestamp: new Date(log.created_at).toLocaleString(),
      Message: log.message
    }));
    exportToCSV(data, 'System_Logs_Report');
  };

  const handleExportLogsPDF = () => {
    const headers = ['Timestamp', 'Message'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.message
    ]);
    exportToPDF('System Logs Report', headers, rows, 'System_Logs_Report');
  };

  return (
    <div className="space-y-8">
      <SystemInfo />
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Recent System Logs</h3>
          <div className="flex gap-2">
            <button onClick={handleExportLogsCSV} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
              <FileSpreadsheet size={14} /> CSV
            </button>
            <button onClick={handleExportLogsPDF} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>
        {error && <div className="text-red-600 font-semibold mb-4">{error}</div>}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.length > 0 ? logs.map((log) => (
            <div key={log.id} className="text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono flex gap-4">
              <span className="text-blue-600 shrink-0 font-bold">[{new Date(log.created_at).toLocaleString()}]</span>
              <span className="text-slate-700 break-all">{log.message}</span>
            </div>
          )) : (
            <div className="text-sm text-slate-400 italic p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
              No system logs found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export const Route = createFileRoute('/admin/system')({
  head: () => ({ meta: [{ title: "Admin — System — SmartLMS" }] }),
  component: SystemPage,
});
