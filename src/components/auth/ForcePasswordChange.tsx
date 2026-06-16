"use client";

import React, { useState } from 'react';
import { updatePassword } from '@/lib/api-actions';
import { useAppContext } from '@/components/AppContext';
import { Lock, Save, ShieldCheck } from 'lucide-react';

interface ForcePasswordChangeProps {
    onSuccess: () => void;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ onSuccess }) => {
    const { addToast } = useAppContext();
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.new_password !== formData.confirm_password) {
            addToast('Passwords do not match', 'error');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(formData.new_password)) {
            addToast('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const res = await updatePassword(formData.current_password, formData.new_password);
            if (res.success) {
                addToast('Password updated successfully! Your account is now secure.', 'success');
                onSuccess();
            } else {
                throw new Error(res.error);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to update password';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                <header className="p-8 border-b bg-blue-600 text-white flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">Secure Your Account</h2>
                    <p className="text-blue-100 text-sm mt-2">You are using a temporary password. Please set a new permanent password to continue.</p>
                </header>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Temporary Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="password" required
                                value={formData.current_password}
                                onChange={e => setFormData({...formData, current_password: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter temp password"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">New Password</label>
                        <input
                            type="password" required
                            value={formData.new_password}
                            onChange={e => setFormData({...formData, new_password: e.target.value})}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            placeholder="Min 8 characters"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Confirm New Password</label>
                        <input
                            type="password" required
                            value={formData.confirm_password}
                            onChange={e => setFormData({...formData, confirm_password: e.target.value})}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                            placeholder="Repeat new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {isSaving ? 'Updating...' : 'Set New Password'}
                    </button>
                </form>

                <footer className="px-8 pb-8 text-center">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">SmartLMS Security Enforcement</p>
                </footer>
            </div>
        </div>
    );
};
