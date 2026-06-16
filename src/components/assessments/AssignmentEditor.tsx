import React, { useState, useEffect } from 'react';
import { AssignmentDTO } from '@/lib/types';
import { CourseDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { Plus, Paperclip, Settings } from 'lucide-react';
import { saveAssignment } from '@/lib/api-actions';
import { useAuth } from '@/components/auth/AuthContext';
import { ASSESSMENT_STATUS, ANTI_CHEAT_VIOLATIONS } from '@/lib/constants';
import { Modal } from '@/components/ui/Modal';
import { AntiCheatConfigModal } from './AntiCheatConfigModal';

interface AssignmentEditorProps {
    teacherId: string;
    assignment?: AssignmentDTO;
    courses: CourseDTO[];
    onSave: () => void;
    onCancel: () => void;
}

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({ teacherId, assignment, courses, onSave, onCancel }) => {
    const { addToast } = useAppContext();
    const { user } = useAuth();
    const [formData, setFormData] = useState<AssignmentDTO>({
        id: assignment?.id || '',
        teacher_id: teacherId,
        title: assignment?.title || '',
        description: assignment?.description || '',
        course_id: assignment?.course_id || (courses.length > 0 ? courses[0].id : ''),
        start_at: assignment?.start_at ? new Date(assignment.start_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        due_date: assignment?.due_date ? new Date(assignment.due_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        points_possible: assignment?.points_possible || 0,
        status: assignment?.status || ASSESSMENT_STATUS.DRAFT,
        allow_late_submissions: assignment?.allow_late_submissions !== false,
        late_penalty_per_day: assignment?.late_penalty_per_day || 0,
        anti_cheat_enabled: assignment?.anti_cheat_enabled || false,
        hard_enforcement: assignment?.hard_enforcement || false,
        regrade_requests_enabled: assignment?.regrade_requests_enabled !== false,
        questions: assignment?.questions || [],
        attachments: assignment?.attachments || [],
        allowed_extensions: assignment?.allowed_extensions || ['pdf', 'doc', 'docx', 'zip', 'jpg', 'png'],
        metadata: assignment?.metadata || {}
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showAntiCheatModal, setShowAntiCheatModal] = useState(false);
    const [metadataText, setMetadataText] = useState(JSON.stringify(assignment?.metadata || {}, null, 2));
    const [isUploading, setIsUploading] = useState(false);

    // Auto-calculate points_possible
    useEffect(() => {
        const total = formData.questions.reduce((sum: number, q) => sum + (q.points || 0), 0);
        setFormData((prev) => ({ ...prev, points_possible: total }));
    }, [formData.questions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate metadata
        let parsedMetadata = {};
        try {
            parsedMetadata = JSON.parse(metadataText);
        } catch {
            addToast('Invalid JSON in metadata field', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                teacher_id: teacherId,
                id: assignment?.id || '',
                metadata: parsedMetadata
            };
            const result = await saveAssignment(payload);
            if (!result.success) {
                throw new Error(result.error || 'Failed to save assignment');
            }
            addToast('Assignment saved successfully!', 'success');
            onSave();
        } catch (err: unknown) {
            console.error('Save failed:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save assignment.';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addStep = () => {
        setFormData({
            ...formData,
            questions: [...formData.questions, { id: crypto.randomUUID(), text: '', type: 'essay', points: 10 }]
        });
    };

    const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('category', 'materials');

            const res = await fetch('/api/v1/system/upload', {
                method: 'POST',
                headers: {
                    'x-session-id': user?.sessionId || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formDataUpload
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const result = await res.json();
            const publicUrl = result.data?.publicUrl || result.publicUrl;

            setFormData(prev => ({
                ...prev,
                attachments: [...(prev.attachments || []), { name: file.name, url: publicUrl, type: file.type }]
            }));
            addToast('Attachment uploaded!', 'success');
        } catch (err) {
            console.error('Attachment upload failed:', err);
            addToast('Upload failed', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal
            title={assignment?.id ? 'Edit Assignment' : 'Create New Assignment'}
            onClose={onCancel}
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex flex-col sm:flex-row justify-between gap-4 w-full">
                    <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-4">Discard</button>
                    <button type="submit" disabled={isSaving} className="btn-primary flex-1 py-4">{isSaving ? 'Saving...' : 'Save Assignment'}</button>
                </div>
            }
        >
            <div className="space-y-6">
                    <div className="bg-slate-50 p-4 md:p-6 rounded-3xl border-2 border-slate-100 space-y-6">
                        <h3 className="text-base md:text-lg font-bold text-slate-900 border-b pb-4 mb-4">Assignment Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Assignment Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Course</label>
                                <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm">
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Description</label>
                            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-32 p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all resize-none shadow-sm" placeholder="Assignment instructions..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Start At</label>
                                    <input type="datetime-local" required value={formData.start_at} onChange={e => setFormData({...formData, start_at: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Due Date</label>
                                    <input type="datetime-local" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm text-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Points Possible</label>
                                    <input type="number" readOnly value={formData.points_possible} className="w-full p-4 rounded-xl border-2 border-white bg-slate-100 text-slate-500 outline-none transition-all font-bold shadow-sm text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs md:text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssignmentDTO['status']})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm text-sm">
                                        <option value={ASSESSMENT_STATUS.DRAFT}>Draft</option>
                                        <option value={ASSESSMENT_STATUS.PUBLISHED}>Published</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 space-y-4 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Late Submissions</h4>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="allowLate" checked={formData.allow_late_submissions} onChange={e => setFormData({...formData, allow_late_submissions: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                                    <label htmlFor="allowLate" className="text-sm font-bold text-slate-700 cursor-pointer">Allow Late Submissions</label>
                                </div>
                                {formData.allow_late_submissions && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Penalty Per Day (%)</label>
                                        <input
                                            type="number" min="0" max="100"
                                            value={formData.late_penalty_per_day}
                                            onChange={e => setFormData({...formData, late_penalty_per_day: Number(e.target.value)})}
                                            className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-6 rounded-2xl border-2 border-slate-50 space-y-4 shadow-sm">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enforcement & Options</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" id="antiCheat" checked={formData.anti_cheat_enabled} onChange={e => setFormData({...formData, anti_cheat_enabled: e.target.checked})} className="w-5 h-5 text-blue-600" />
                                            <label htmlFor="antiCheat" className="text-sm font-bold text-slate-700 cursor-pointer">Anti-Cheat Monitoring</label>
                                        </div>
                                        {formData.anti_cheat_enabled && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAntiCheatModal(true)}
                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                title="Configure Violations"
                                            >
                                                <Settings size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="hardEnforce" checked={formData.hard_enforcement} onChange={e => setFormData({...formData, hard_enforcement: e.target.checked})} className="w-5 h-5 text-red-600" />
                                        <label htmlFor="hardEnforce" className="text-sm font-bold text-slate-700 cursor-pointer">Hard Enforcement (Lock on violation)</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="regradeEnabled" checked={formData.regrade_requests_enabled} onChange={e => setFormData({...formData, regrade_requests_enabled: e.target.checked})} className="w-5 h-5 text-blue-600" />
                                        <label htmlFor="regradeEnabled" className="text-sm font-bold text-slate-700 cursor-pointer">Allow Regrade Requests</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <AntiCheatConfigModal
                            isOpen={showAntiCheatModal}
                            onClose={() => setShowAntiCheatModal(false)}
                            config={(formData.metadata?.antiCheatConfig as any) || {}}
                            onChange={(newConfig) => {
                                setFormData({
                                    ...formData,
                                    metadata: {
                                        ...formData.metadata,
                                        antiCheatConfig: newConfig
                                    }
                                });
                                setMetadataText(JSON.stringify({
                                    ...formData.metadata,
                                    antiCheatConfig: newConfig
                                }, null, 2));
                            }}
                        />

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Attachments & Restrictions</label>
                            <div className="flex flex-wrap gap-2">
                                {formData.attachments?.map((att, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-xs font-medium border border-slate-100">
                                        <span className="truncate max-w-[150px]">{att.name}</span>
                                        <button type="button" onClick={() => {
                                            const updated = [...(formData.attachments || [])];
                                            updated.splice(idx, 1);
                                            setFormData({ ...formData, attachments: updated });
                                        }} className="text-red-500 font-bold hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center">×</button>
                                    </div>
                                ))}
                                <label className={`flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <input type="file" className="hidden" onChange={handleAttachmentUpload} disabled={isUploading} />
                                    <Paperclip size={12} /> {isUploading ? 'Uploading...' : 'Add Attachment'}
                                </label>
                            </div>
                            <input
                                type="text"
                                value={(formData.allowed_extensions || []).join(', ')}
                                onChange={e => setFormData({ ...formData, allowed_extensions: e.target.value.split(',').map(s => s.trim()) })}
                                className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm"
                                placeholder="Allowed extensions: pdf, doc, docx, zip"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                                <Settings size={16} /> Advanced Metadata (JSON)
                            </label>
                            <textarea
                                value={metadataText}
                                onChange={e => setMetadataText(e.target.value)}
                                className="w-full h-32 p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all font-mono text-xs shadow-sm bg-slate-100"
                                placeholder='{"key": "value"}'
                            />
                        </div>
                    </div>


                    <div className="space-y-6 pt-8 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Task Questions / Steps</h3>
                        </div>
                        {formData.questions.map((q, index) => (
                            <div key={index} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={q.type}
                                        onChange={e => {
                                            const updated = [...formData.questions];
                                            updated[index].type = e.target.value as 'essay' | 'file' | 'link';
                                            setFormData({ ...formData, questions: updated });
                                        }}
                                        className="p-3 rounded-xl border border-slate-200 bg-white text-sm"
                                    >
                                        <option value="essay">Written Response</option>
                                        <option value="file">File Upload</option>
                                        <option value="link">Link Submission</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={q.points}
                                        onChange={e => {
                                            const updated = [...formData.questions];
                                            updated[index].points = Number(e.target.value);
                                            setFormData({ ...formData, questions: updated });
                                        }}
                                        className="p-3 rounded-xl border border-slate-200 bg-white text-sm"
                                        placeholder="Points"
                                    />
                                </div>
                                <textarea
                                    value={q.text}
                                    onChange={e => {
                                        const updated = [...formData.questions];
                                        updated[index].text = e.target.value;
                                        setFormData({ ...formData, questions: updated });
                                    }}
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm min-h-[100px]"
                                    placeholder="Question text or instruction step..."
                                />
                                <button type="button" onClick={() => {
                                    const updated = [...formData.questions];
                                    updated.splice(index, 1);
                                    setFormData({ ...formData, questions: updated });
                                }} className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Remove Step</button>
                            </div>
                        ))}

                        <button type="button" onClick={addStep} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all font-bold flex items-center justify-center gap-2">
                            <Plus size={18} /> Add Step
                        </button>
                    </div>
            </div>
        </Modal>
    );
};
