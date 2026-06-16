import React, { useState } from 'react';
import { UserDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { saveUser } from '@/lib/api-actions';

interface UserEditorProps {
    user?: UserDTO;
    onSave: () => void;
    onCancel: () => void;
}

export const UserEditor: React.FC<UserEditorProps> = ({ user, onSave, onCancel }) => {
    const { addToast } = useAppContext();
    const [formData, setFormData] = useState({
        email: user?.email || '',
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        role: user?.role || 'student',
        password: '',
        metadata: user?.metadata || {}
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (user?.id) {
                // Update User
                const userData = {
                    id: user.id,
                    email: formData.email,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    role: formData.role as 'student' | 'teacher' | 'admin',
                    password: formData.password || undefined,
                    active: user.active,
                    flagged: (user).flagged as boolean,
                    reset_request: null, // Invalidate reset request on edit
                    metadata: formData.metadata
                };

                await saveUser(userData);
                addToast('User profile updated successfully. Reset requests invalidated.', 'success');
            } else {
                // Create New User
                const res = await saveUser({
                    email: formData.email,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    role: formData.role as 'student' | 'teacher' | 'admin',
                    password: formData.password,
                    active: true
                });

                if (!res.success) {
                    addToast(res.error || 'Failed to create user.', 'error');
                    setIsSaving(false);
                    return;
                }
                addToast('New user created.', 'success');
            }
            onSave();
        } catch (err: unknown) {
            console.error('Save failed:', err);
            const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh]">
                <header className="p-6 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">{user?.id ? 'Edit User' : 'Add New User'}</h2>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
                </header>
                <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Full Name</label>
                            <input
                                type="text" required
                                value={formData.full_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Role</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'student' | 'teacher' | 'admin' }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Email Address</label>
                            <input
                                type="email" required
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="john@example.com"
                                disabled={!!user?.id}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Phone Number</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">{user?.id ? 'New Password (Optional)' : 'Password'}</label>
                        <input
                            type="password" required={!user?.id}
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Metadata (JSON format)</label>
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
                            className="w-full h-32 p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-mono text-xs"
                            placeholder='{ "key": "value" }'
                        />
                    </div>
                    <footer className="pt-8 border-t flex flex-col sm:flex-row justify-between gap-4 shrink-0">
                        <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-4">Cancel</button>
                        <button type="submit" disabled={isSaving} className="btn-primary flex-1 py-4">
                            {isSaving ? 'Saving...' : user?.id ? 'Update User' : 'Create User'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};
