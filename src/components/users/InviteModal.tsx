import React, { useState } from 'react';
import { UserRole } from '@/lib/types';
import { generateInvite } from '@/lib/api-actions';
import { Copy, Check, X, Mail, Shield, User, GraduationCap } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
    const [role, setRole] = useState<UserRole>('student');
    const [email, setEmail] = useState('');
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setInviteLink(null);

        try {
            const res = await generateInvite(role, (role === 'admin' || role === 'teacher') ? email : undefined);
            if (res.success && res.data) {
                setInviteLink(res.data.link);
            } else {
                setError(res.error || 'Failed to generate invite');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal onClose={onClose} title="Invite New User">
            <div className="p-1">
                {!inviteLink ? (
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Role</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'admin', icon: Shield, label: 'Admin' },
                                    { id: 'teacher', icon: User, label: 'Teacher' },
                                    { id: 'student', icon: GraduationCap, label: 'Student' }
                                ].map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setRole(r.id as UserRole)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                                            role === r.id
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        <r.icon size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(role === 'admin' || role === 'teacher') && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient Email (Required)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="input-custom pl-10"
                                        required
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium italic">
                                    This invite will be bound to this email address.
                                </p>
                            </div>
                        )}

                        {role === 'student' && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Student invites are <strong>role-only</strong>. Anyone with the link can sign up as a student.
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            {isLoading ? 'Generating...' : 'Generate Invite Link'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
                                <Check size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">Invite Link Ready!</h3>
                            <p className="text-xs text-slate-500">Share this link with the user to allow them to sign up.</p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative flex items-center gap-2 p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <input
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 bg-transparent border-none text-xs font-mono text-slate-600 focus:ring-0 truncate"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                        copied ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                                <Shield size={18} className="shrink-0" />
                                <p className="text-[10px] font-bold uppercase tracking-tight leading-normal">
                                    Security Notice: This link is one-time use and expires in 7 days.
                                </p>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
