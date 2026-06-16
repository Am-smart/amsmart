import React, { useState } from 'react';
import { CourseDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { createBroadcast } from '@/lib/api-actions';

interface BroadcastManagerProps {
    initialCourses: CourseDTO[];
}

export const BroadcastManager: React.FC<BroadcastManagerProps> = ({ initialCourses }) => {
    const { addToast } = useAppContext();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('all');
    const [targetRole, setTargetRole] = useState<'all' | 'student' | 'teacher'>('all');
    const [link, setLink] = useState('');
    const [expiresIn, setExpiresIn] = useState('30');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !message) return;

        setIsSending(true);
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));

            await createBroadcast({
                course_id: selectedCourseId === 'all' ? null : selectedCourseId,
                target_role: targetRole === 'all' ? null : targetRole,
                title,
                message,
                link: link || undefined,
                expires_at: expiresAt.toISOString()
            });

            setTitle('');
            setMessage('');
            setLink('');
            addToast('Broadcast sent successfully!', 'success');
        } catch (err: unknown) {
            console.error('Broadcast failed:', err);
            addToast('Failed to send broadcast.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold mb-6">Send Global Broadcast</h3>
            <form onSubmit={handleSend} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Target Course</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50"
                        >
                            <option value="all">All Courses (System-wide)</option>
                            {initialCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Target Role</label>
                        <select
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value as 'all' | 'student' | 'teacher')}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-slate-50"
                        >
                            <option value="all">Everyone</option>
                            <option value="student">Students Only</option>
                            <option value="teacher">Teachers Only</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Broadcast Title</label>
                    <input
                        type="text" required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                        placeholder="Maintenance Alert, New Feature, etc."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Message Content</label>
                    <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all min-h-[120px]"
                        placeholder="Describe the announcement in detail..."
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Link URL (Optional)</label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Expires In (Days)</label>
                        <input
                            type="number"
                            value={expiresIn}
                            onChange={(e) => setExpiresIn(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            min="1"
                        />
                    </div>
                </div>

                <button type="submit" disabled={isSending} className="btn-primary w-full py-4 text-lg">
                    {isSending ? 'Sending...' : '📢 Dispatch Broadcast'}
                </button>
            </form>
        </div>
    );
};
