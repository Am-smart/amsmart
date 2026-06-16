import React, { useState } from 'react';
import { MaintenanceDTO, MaintenanceSchedule } from '@/lib/types';
import { Plus, Trash2, Clock, MessageSquare } from 'lucide-react';
import { updateMaintenance } from '@/lib/api-actions';

interface MaintenancePanelProps {
  maintenance: MaintenanceDTO | null;
  onToggle: (enabled: boolean) => Promise<void>;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ maintenance, onToggle }) => {
  const [newSchedule, setNewSchedule] = useState<MaintenanceSchedule>({
    start_at: '',
    end_at: '',
    reason: ''
  });
  const [customMessage, setCustomMessage] = useState(maintenance?.message || 'System is undergoing maintenance.');

  const handleAddSchedule = async () => {
    if (!maintenance || !newSchedule.start_at || !newSchedule.end_at) return;

    const updatedSchedules = [...(maintenance.schedules || []), newSchedule];
    await updateMaintenance({ id: maintenance.id, schedules: updatedSchedules });
    setNewSchedule({ start_at: '', end_at: '', reason: '' });
    window.location.reload();
  };

  const handleRemoveSchedule = async (index: number) => {
    if (!maintenance) return;
    const updatedSchedules = [...maintenance.schedules];
    updatedSchedules.splice(index, 1);
    await updateMaintenance({ id: maintenance.id, schedules: updatedSchedules });
    window.location.reload();
  };

  const handleUpdateMessage = async () => {
    if (!maintenance) return;
    await updateMaintenance({ id: maintenance.id, message: customMessage });
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <Clock className="text-blue-600" /> System Control
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm">Immediate Maintenance Mode</h3>
                        <p className="text-xs text-slate-500 mt-1">Force enable/disable maintenance globally.</p>
                    </div>
                    <button
                        onClick={() => onToggle(!maintenance?.enabled)}
                        className={`px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${maintenance?.enabled ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {maintenance?.enabled ? 'Disable' : 'Enable Now'}
                    </button>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <MessageSquare size={16} className="text-blue-600" /> Maintenance Message
                    </h3>
                    <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        className="w-full p-4 rounded-xl border border-blue-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Customize the message shown to users..."
                        rows={3}
                    />
                    <button
                        onClick={handleUpdateMessage}
                        className="btn-primary w-full py-3 text-xs"
                    >
                        Update Custom Message
                    </button>
                </div>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                <h3 className="font-bold text-slate-900 text-sm">Schedule Maintenance</h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Time</label>
                            <input
                                type="datetime-local"
                                value={newSchedule.start_at}
                                onChange={(e) => setNewSchedule({...newSchedule, start_at: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">End Time</label>
                            <input
                                type="datetime-local"
                                value={newSchedule.end_at}
                                onChange={(e) => setNewSchedule({...newSchedule, end_at: e.target.value})}
                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs"
                            />
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Reason (e.g. Database Migration)"
                        value={newSchedule.reason}
                        onChange={(e) => setNewSchedule({...newSchedule, reason: e.target.value})}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs"
                    />
                    <button
                        onClick={handleAddSchedule}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-black transition-colors"
                    >
                        <Plus size={14} /> Add Maintenance Window
                    </button>
                </div>
            </div>
        </div>

        {maintenance?.schedules && maintenance.schedules.length > 0 && (
            <div className="mt-8 space-y-4 pt-8 border-t">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Planned Downtime</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenance.schedules.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <div className="flex gap-3 items-center">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <Clock size={16} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-900">{s.reason || 'Routine Maintenance'}</div>
                                    <div className="text-[10px] text-slate-500">
                                        {new Date(s.start_at).toLocaleString()} - {new Date(s.end_at).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleRemoveSchedule(idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {maintenance?.enabled && (
            <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-[24px] flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl shrink-0 animate-pulse">🛑</div>
                <div>
                    <p className="text-sm text-red-800 font-bold tracking-tight">System Lockdown Active</p>
                    <p className="text-xs text-red-600 font-medium">All non-administrative traffic is currently redirected to the maintenance page.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
