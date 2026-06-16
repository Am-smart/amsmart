import React, { useState, useEffect, useCallback } from 'react';
import { CourseDTO, LessonDTO } from '@/lib/types';
import { Plus, Trash2, GripVertical, Save, X, Edit2 } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { getLessons, saveLesson, deleteLesson } from '@/lib/api-actions';

interface LessonEditorProps {
    course: CourseDTO;
    onClose: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ course, onClose }) => {
    const { addToast } = useAppContext();
    const [lessons, setLessons] = useState<LessonDTO[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingLesson, setEditingLesson] = useState<LessonDTO | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '', video_url: '' });

    const fetchLessons = useCallback(async () => {
        const data = await getLessons(course.id);
        setLessons(data || []);
    }, [course.id]);

    useEffect(() => { fetchLessons(); }, [fetchLessons]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingLesson) {
                await saveLesson({
                    ...formData,
                    id: editingLesson.id,
                    course_id: course.id
                });
                addToast('Lesson updated successfully!', 'success');
            } else {
                await saveLesson({
                    ...formData,
                    course_id: course.id,
                    order_index: lessons.length
                });
                addToast('Lesson added successfully!', 'success');
            }
            setIsAdding(false);
            setEditingLesson(null);
            setFormData({ title: '', content: '', video_url: '' });
            fetchLessons();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to save lesson';
            addToast(msg, 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await deleteLesson(id);
            addToast('Lesson deleted', 'success');
            fetchLessons();
        } catch (err) {
            console.error('Delete failed:', err);
            addToast('Failed to delete lesson', 'error');
        }
    };

    const startEdit = (lesson: LessonDTO) => {
        setEditingLesson(lesson);
        setFormData({
            title: lesson.title,
            content: lesson.content,
            video_url: lesson.video_url || ''
        });
        setIsAdding(true);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-[4000] flex items-center justify-center p-2 md:p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in">
                <header className="p-4 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg md:text-2xl font-bold text-slate-900">Manage Lessons</h2>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500 mt-1">Course: {course.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={24} /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="font-bold text-slate-900 text-sm md:text-base">Course Content ({lessons.length} Lessons)</h3>
                        {!isAdding && (
                            <button onClick={() => { setIsAdding(true); setEditingLesson(null); setFormData({ title: '', content: '', video_url: '' }); }} className="btn-secondary py-2 px-4 text-xs flex items-center gap-2 w-full sm:w-auto justify-center">
                                <Plus size={16} /> Add Lesson
                            </button>
                        )}
                    </div>

                    {isAdding && (
                        <form onSubmit={handleSubmit} className="p-4 md:p-6 bg-blue-50/50 rounded-2xl border-2 border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Lesson Title</label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="input-custom bg-white" placeholder="Introduction to..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Video URL (Optional)</label>
                                    <input type="url" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} className="input-custom bg-white" placeholder="https://youtube.com/..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Lesson Content</label>
                                    <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="input-custom bg-white h-32 resize-none" placeholder="Lesson body text..." />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setIsAdding(false); setEditingLesson(null); }} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-xs flex items-center gap-2">
                                    <Save size={14} /> {editingLesson ? 'Update Lesson' : 'Save Lesson'}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-4">
                        {lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-white border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all shadow-sm">
                                <div className="text-slate-300 group-hover:text-blue-400 shrink-0"><GripVertical size={20} /></div>
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center font-bold text-slate-400 text-xs shrink-0">{idx + 1}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900 text-sm md:text-base truncate">{lesson.title}</h4>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">{lesson.content}</p>
                                </div>
                                <div className="flex gap-1 md:gap-2 shrink-0">
                                    <button onClick={() => startEdit(lesson)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(lesson.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
