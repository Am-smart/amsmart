import React, { useState } from 'react';
import { UserDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { approveResetRequest, denyResetRequest } from '@/lib/api-actions';
import { CheckCircle, XCircle, ShieldAlert } from 'lucide-react';

interface PasswordResetProps {
    users: UserDTO[];
    onRefresh: () => void;
}

interface ResetRequestMetadata {
    status: 'pending' | 'approved' | 'denied';
    reason?: string;
    denial_reason?: string;
    temp_password?: string;
    expires_at?: string;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ users, onRefresh }) => {
    const { addToast } = useAppContext();
    const [selectedId, setSelectedId] = useState('');
    const [denialReason, setDenialReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const pendingUsers = users.filter(u => {
        const req = (u).reset_request as ResetRequestMetadata | null;
        return req && req.status === 'pending';
    });

    const generateSecurePassword = () => {
        const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const lower = "abcdefghijkmnopqrstuvwxyz";
        const nums = "23456789";
        const allowedSpec = "@$!%*?&";

        const alphaNum = upper + lower + nums;

        let pwd = "";
        pwd += upper[Math.floor(Math.random() * upper.length)];
        pwd += lower[Math.floor(Math.random() * lower.length)];
        pwd += nums[Math.floor(Math.random() * nums.length)];
        pwd += allowedSpec[Math.floor(Math.random() * allowedSpec.length)];

        // Add 4 more alphanumeric characters to reach length 8
        for (let i = 0; i < 4; i++) {
            pwd += alphaNum[Math.floor(Math.random() * alphaNum.length)];
        }

        return pwd.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const handleApprove = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        setIsProcessing(true);
        try {
            const tempPass = generateSecurePassword();
            const res = await approveResetRequest(userId, tempPass);

            if (res.success) {
                addToast(`Request approved! Temp Password: ${tempPass}`, 'success', 10000);
                onRefresh();
            } else {
                throw new Error(res.error);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Approval failed';
            addToast(msg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeny = async (userId: string) => {
        if (!denialReason.trim()) {
            addToast('Please provide a reason for denial', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await denyResetRequest(userId, denialReason);
            if (res.success) {
                addToast('Reset request denied.', 'info');
                setDenialReason('');
                onRefresh();
            } else {
                throw new Error(res.error);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Denial failed';
            addToast(msg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Password Reset Requests</h2>
                <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    {pendingUsers.length} Pending
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {pendingUsers.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center text-slate-400">
                        <ShieldAlert size={48} className="mb-4 opacity-20" />
                        <p className="font-medium italic">No pending password reset requests.</p>
                    </div>
                ) : (
                    pendingUsers.map(user => {
                        const request = (user).reset_request as ResetRequestMetadata | null;
                        return (
                            <div key={user.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-slate-900">{user.full_name}</h3>
                                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500 uppercase">{user.role}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4 font-medium">{user.email}</p>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reason for Reset</label>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium italic">&ldquo;{request?.reason || 'No reason provided'}&rdquo;</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full md:w-72 justify-center">
                                    <button
                                        onClick={() => handleApprove(user.id)}
                                        disabled={isProcessing}
                                        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Approve Reset
                                    </button>

                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Denial reason..."
                                            value={selectedId === user.id ? denialReason : ''}
                                            onChange={(e) => { setSelectedId(user.id); setDenialReason(e.target.value); }}
                                            className="w-full p-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-red-400 transition-all"
                                        />
                                        <button
                                            onClick={() => handleDeny(user.id)}
                                            disabled={isProcessing || selectedId !== user.id || !denialReason}
                                            className="btn-secondary w-full py-3 text-red-600 border-red-100 hover:bg-red-50 flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} /> Deny Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
