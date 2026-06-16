import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { CourseDTO } from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';
import { saveCourse } from '@/lib/api-actions';
import { useAuth } from '@/components/auth/AuthContext';
import { Modal } from '@/components/ui/Modal';

interface CourseEditorProps {
    teacherId: string;
    course?: CourseDTO;

    onSave: () => void;
    onCancel: () => void;
}

const BOOK_EMOJIS = ['📖', '📘', '📗', '📙', '📓', '📒', '📚', '🎓', '📝', '🧪', '🎨', '💻'];

export const CourseEditor: React.FC<CourseEditorProps> = ({ course, teacherId, onSave, onCancel }) => {
    const { addToast } = useAppContext();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: course?.title || '',
        description: course?.description || '',
        enrollment_id: course?.enrollment_id || '',
        status: course?.status || 'draft',
        thumbnail_url: course?.thumbnail_url || BOOK_EMOJIS[Math.floor(Math.random() * BOOK_EMOJIS.length)],
        metadata: course?.metadata ? JSON.parse(JSON.stringify(course.metadata)) : {}
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToQueue, isOnline } = useIndexedDB();

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('category', 'courses');

            const response = await fetch('/api/v1/system/upload', {
                method: 'POST',
                headers: {
                    'x-session-id': user?.sessionId || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: uploadFormData
            });

            if (!response.ok) throw new Error('Upload failed');

            const result = await response.json();
            const publicUrl = result.data?.publicUrl || result.publicUrl;
            setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
            addToast('Thumbnail uploaded successfully!', 'success');
        } catch (err) {
            console.error('Upload error:', err);
            addToast('Failed to upload thumbnail.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSaving(true);
        try {
            const courseData = {
                ...formData,
                teacher_id: teacherId,
                id: course?.id
            };

            if (isOnline) {
                await saveCourse(courseData);
                addToast('Course saved successfully!', 'success');
            } else {
                await addToQueue('COURSE_SAVE', courseData);
                addToast('Offline: Course changes queued for synchronization.', 'info');
            }

            onSave();
        } catch (err: unknown) {
            console.error('Save failed:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save course.';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            title={course?.id ? 'Edit Course' : 'Create New Course'}
            onClose={onCancel}
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex flex-col md:flex-row justify-between gap-3 md:gap-4 w-full">
                    <button type="button" onClick={onCancel} className="btn-secondary py-3 md:py-4 text-sm flex-1">Discard Changes</button>
                    <button type="submit" disabled={isSaving} className="btn-primary py-3 md:py-4 text-sm flex-1">
                        {isSaving ? 'Saving...' : course?.id ? 'Update Course' : 'Create Course'}
                    </button>
                </div>
            }
        >
            <div className="space-y-4 md:space-y-6">
                {!isOnline && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold uppercase">
                        ⚠️ Working Offline - Changes will sync later
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Course Title *</label>
                    <input
                        type="text" required
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className={`w-full p-4 rounded-xl border-2 outline-none transition-all text-sm ${errors.title ? 'border-red-500 focus:border-red-600' : 'border-slate-100 focus:border-blue-500'}`}
                        placeholder="e.g. Advanced React Architecture"
                    />
                    {errors.title && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.title}</p>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Description *</label>
                    <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className={`w-full h-32 p-4 rounded-xl border-2 outline-none transition-all resize-none text-sm ${errors.description ? 'border-red-500 focus:border-red-600' : 'border-slate-100 focus:border-blue-500'}`}
                        placeholder="Describe what students will learn..."
                    />
                    {errors.description && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.description}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Enrollment ID (Optional)</label>
                        <input
                            type="text"
                            value={formData.enrollment_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, enrollment_id: e.target.value }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                            placeholder="e.g. CS101"
                        />
                        <p className="text-[10px] text-slate-400 mt-1 italic">If provided, students will need this ID to enroll.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                        >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Course Thumbnail</label>
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                        />

                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <ImageIcon size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Or paste an image URL..."
                                        value={formData.thumbnail_url.startsWith('http') ? formData.thumbnail_url : ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm font-mono"
                                    />
                                </div>
                            </div>
                            <div className="w-16 h-16 rounded-xl border-2 border-slate-100 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
                                {formData.thumbnail_url && (
                                    formData.thumbnail_url.startsWith('http') ? (
                                        <Image
                                            src={formData.thumbnail_url}
                                            alt="Preview"
                                            fill
                                            sizes="64px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl">{formData.thumbnail_url}</span>
                                    )
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {BOOK_EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: emoji }))}
                                    className={`py-2 flex items-center justify-center rounded-lg border-2 transition-all ${
                                        formData.thumbnail_url === emoji ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="text-xl">{emoji}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="py-2 flex items-center justify-center rounded-lg border-2 border-slate-100 hover:border-slate-300 transition-all bg-slate-50"
                                title="Upload Image"
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Upload size={18} className="text-slate-600" />
                                )}
                            </button>
                        </div>
                        {errors.thumbnail_url && <p className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.thumbnail_url}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Metadata (JSON format)</label>
                    <textarea
                        value={JSON.stringify(formData.metadata, null, 2)}
                        onChange={(e) => {
                            try {
                                const metadata = JSON.parse(e.target.value);
                                setFormData(prev => ({ ...prev, metadata }));
                            } catch {
                                // Allow invalid JSON while typing
                            }
                        }}
                        className="w-full h-32 p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all font-mono text-xs"
                        placeholder='{ "key": "value" }'
                    />
                </div>
            </div>
        </Modal>
    );
};
