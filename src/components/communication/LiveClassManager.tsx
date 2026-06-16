import React, { useState } from 'react';
import { LiveClassDTO } from '@/lib/types';
import { CourseDTO } from '@/lib/types';
import { Video, Calendar, Clock, Trash2, Play, Square, ExternalLink, Edit2 } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { saveLiveClass, deleteLiveClass } from '@/lib/api-actions';

interface LiveClassManagerProps {
    teacherId: string;
    liveClasses: LiveClassDTO[];
    courses: CourseDTO[];
    onRefresh: () => void;
}

export const LiveClassManager: React.FC<LiveClassManagerProps> = ({ teacherId, liveClasses, courses, onRefresh }) => {
    const { addToast } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        course_id: courses[0]?.id || '',
        start_at: '',
        end_at: '',
        room_name: '',
        description: '',
        recurring_config: '',
        recording_url: ''
    });

    const resetForm = () => {
        setFormData({
            title: '',
            course_id: courses[0]?.id || '',
            start_at: '',
            end_at: '',
            room_name: '',
            description: '',
            recurring_config: '',
            recording_url: ''
        });
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const roomName = formData.room_name || `room_${Math.random().toString(36).substr(2, 9)}`;
            let recurring = {};
            try {
                if (typeof formData.recurring_config === 'string' && formData.recurring_config) {
                    recurring = JSON.parse(formData.recurring_config);
                } else {
                    recurring = formData.recurring_config || {};
                }
            } catch { /* ignore error */ }

            await saveLiveClass({
                ...formData,
                id: editingId || undefined,
                teacher_id: teacherId,
                status: editingId ? undefined : 'scheduled',
                room_name: roomName,
                meeting_url: editingId ? undefined : `https://meet.jit.si/${roomName}`,
                recurring_config: recurring
            });
            addToast(editingId ? 'Live class updated!' : 'Live class scheduled!', 'success');
            resetForm();
            onRefresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to save class';
            addToast(msg, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Cancel this class?')) return;
        try {
            await deleteLiveClass(id);
            addToast('Class cancelled.', 'info');
            onRefresh();
        } catch (err) {
            console.error('Cancel failed:', err);
            addToast('Failed to cancel class.', 'error');
        }
    };

    const toggleStatus = async (lc: LiveClassDTO) => {
        const newStatus = lc.status === 'live' ? 'completed' : 'live';
        try {
            await saveLiveClass({
                id: lc.id,
                status: newStatus as 'completed' | 'live',
                actual_end_at: newStatus === 'completed' ? new Date().toISOString() : (null as string | null)
            });

            addToast(`Class ${newStatus === 'live' ? 'is now LIVE!' : 'has ended.'}`, 'success');
            onRefresh();
            if (newStatus === 'live' && lc.meeting_url) {
                window.open(lc.meeting_url, '_blank');
            }
        } catch (err) {
            console.error('Status toggle failed:', err);
            addToast('Failed to update class status.', 'error');
        }
    };

    const startEditing = (lc: LiveClassDTO) => {
        setEditingId(lc.id);
        setFormData({
            title: lc.title,
            course_id: lc.course_id,
            start_at: lc.start_at ? new Date(lc.start_at).toISOString().slice(0, 16) : '',
            end_at: lc.end_at ? new Date(lc.end_at).toISOString().slice(0, 16) : '',
            room_name: lc.room_name,
            description: lc.description || '',
            recurring_config: JSON.stringify(lc.recurring_config || {}),
            recording_url: lc.recording_url || ''
        });
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Live Sessions</h2>
                <button onClick={() => setIsFormOpen(true)} className="btn-primary flex items-center gap-2">
                    <Video size={18} />
                    Schedule Class
                </button>
            </header>

            {isFormOpen && (
                <div className="bg-white p-4 md:p-8 rounded-3xl border border-slate-100 shadow-xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold mb-6 text-slate-900">{editingId ? 'Edit Live Session' : 'New Live Session'}</h3>
                    <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Class Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-custom" placeholder="e.g. Weekly Q&A Session" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-custom h-20" placeholder="Session agenda..." />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Course</label>
                            <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="input-custom">
                                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Room Name (Optional)</label>
                            <input type="text" value={formData.room_name} onChange={e => setFormData({...formData, room_name: e.target.value})} className="input-custom" placeholder="auto-generated" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Start Time</label>
                            <input type="datetime-local" required value={formData.start_at} onChange={e => setFormData({...formData, start_at: e.target.value})} className="input-custom" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">End Time</label>
                            <input type="datetime-local" required value={formData.end_at} onChange={e => setFormData({...formData, end_at: e.target.value})} className="input-custom" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Recording URL (Optional)</label>
                            <input type="url" value={formData.recording_url} onChange={e => setFormData({...formData, recording_url: e.target.value})} className="input-custom" placeholder='https://...' />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 tracking-widest">Recurring Config (JSON)</label>
                            <input type="text" value={formData.recurring_config} onChange={e => setFormData({...formData, recurring_config: e.target.value})} className="input-custom" placeholder='{"frequency": "weekly"}' />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                            <button type="submit" className="btn-primary w-full sm:w-auto px-8">Save Session</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {liveClasses.length === 0 ? (
                    <div className="col-span-full py-12 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400 italic font-medium">
                        No live classes scheduled.
                    </div>
                ) : (
                    liveClasses.map(lc => (
                        <div key={lc.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-900 line-clamp-1">{lc.title}</h3>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">
                                        {courses.find(c => c.id === lc.course_id)?.title}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                    lc.status === 'live' ? 'bg-red-500 text-white animate-pulse' :
                                    lc.status === 'completed' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {lc.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <Calendar size={14} className="text-slate-300" />
                                    {new Date(lc.start_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                    <Clock size={14} className="text-slate-300" />
                                    {new Date(lc.start_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>

                            <div className="mt-auto pt-4 flex gap-2 border-t">
                                {lc.status !== 'completed' ? (
                                    <button onClick={() => toggleStatus(lc)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        lc.status === 'live' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}>
                                        {lc.status === 'live' ? <><Square size={14} /> Stop</> : <><Play size={14} /> Start</>}
                                    </button>
                                ) : (
                                    <div className="flex-1 py-2.5 bg-slate-50 text-slate-400 text-xs font-bold uppercase text-center rounded-xl">Session Ended</div>
                                )}

                                {lc.status === 'live' && lc.meeting_url && (
                                    <button onClick={() => window.open(lc.meeting_url, '_blank')} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100">
                                        <ExternalLink size={18} />
                                    </button>
                                )}

                                <button onClick={() => startEditing(lc)} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100">
                                    <Edit2 size={18} />
                                </button>

                                <button onClick={() => handleDelete(lc.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
