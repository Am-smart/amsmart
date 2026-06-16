import React, { useState } from 'react';
import { UserDTO } from '@/lib/types';
import { exportToCSV, exportToPDF } from '@/lib/report-utils';
import { FileSpreadsheet, FileText, UserPlus, Shield, ShieldAlert, Lock, Unlock, UserCheck, UserX } from 'lucide-react';
import { InviteModal } from './InviteModal';

interface UserManagementProps {
  users: UserDTO[];
  onAdd: () => void;
  onEdit: (user: UserDTO) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: Partial<UserDTO>) => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onAdd, onEdit, onDelete, onUpdate }) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleLock = async (id: string, minutes: number) => {
    const lockedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    await onUpdate(id, { locked_until: lockedUntil, lockouts: (users.find(u => u.id === id)?.lockouts || 0) + 1 });
  };

    const handleExportCSV = () => {
        const data = users.map(u => ({
            Name: u.full_name,
            Email: u.email,
            Role: u.role,
            Active: u.active ? 'Yes' : 'No',
            Flagged: u.flagged ? 'Yes' : 'No',
            Joined: new Date(u.created_at).toLocaleDateString()
        }));
        exportToCSV(data, 'LMS_Users_Report');
    };

    const handleExportPDF = () => {
        const headers = ['Name', 'Email', 'Role', 'Status', 'Joined'];
        const rows = users.map(u => [
            u.full_name,
            u.email,
            u.role,
            u.active ? 'Active' : 'Inactive',
            new Date(u.created_at).toLocaleDateString()
        ]);
        exportToPDF('LMS User Management Report', headers, rows, 'LMS_Users_Report');
    };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                <div className="flex gap-3 mt-2">
                    <button onClick={handleExportCSV} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-green-600 transition-colors">
                        <FileSpreadsheet size={14} /> CSV
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-600 transition-colors">
                        <FileText size={14} /> PDF
                    </button>
                </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white py-2 px-4 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm"
                >
                    <UserPlus size={18} /> Invite
                </button>
                <button onClick={onAdd} className="flex-1 sm:flex-none btn-primary py-2 px-4">Add User</button>
            </div>
        </div>

        <InviteModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="px-6 py-4">User Details</th>
                            <th className="px-6 py-4">Contact Info</th>
                            <th className="px-6 py-4">Security Stats</th>
                            <th className="px-6 py-4 text-right">Administrative Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No users found in the system.</td>
                            </tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                {u.full_name}
                                                {u.role === 'admin' && <Shield size={14} className="text-red-500" />}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${u.role === 'admin' ? 'bg-red-500 text-white' : u.role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'}`}>
                                                    {u.role}
                                                </span>
                                                {u.flagged && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white animate-pulse">
                                                        <ShieldAlert size={10} /> Flagged
                                                    </span>
                                                )}
                                                {!u.active && (
                                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-400 text-white">Deactivated</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium">ID: {u.id.substring(0, 8)}...</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="text-sm font-bold text-slate-600">{u.email}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                Phone: <span className="text-slate-600">{u.phone || 'None Provided'}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium italic">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-w-[200px]">
                                            <div className="text-[9px] text-slate-400 font-black uppercase">Attempts:</div>
                                            <div className="text-[10px] font-bold text-slate-700">{u.failed_attempts || 0}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase">Lockouts:</div>
                                            <div className="text-[10px] font-bold text-slate-700">{u.lockouts || 0}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase">Last Login:</div>
                                            <div className="text-[10px] font-bold text-slate-700">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex gap-1">
                                                <button onClick={() => onEdit(u)} className="btn-secondary text-[9px] py-1 px-3">Edit</button>
                                                <button onClick={() => onDelete(u.id)} className="btn-secondary text-[9px] py-1 px-3 text-red-600">Delete</button>
                                            </div>
                                            <div className="flex flex-wrap justify-end gap-1.5 max-w-[250px]">
                                                <button
                                                    onClick={() => handleLock(u.id, 30)}
                                                    className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Lock for 30 minutes"
                                                >
                                                    <Lock size={10} /> 30m
                                                </button>
                                                <button
                                                    onClick={() => handleLock(u.id, 1440)}
                                                    className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="Lock for 24 hours"
                                                >
                                                    <Lock size={10} /> 24h
                                                </button>
                                                <button
                                                    onClick={() => onUpdate(u.id, { locked_until: null, failed_attempts: 0 })}
                                                    className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-green-600 transition-colors"
                                                >
                                                    <Unlock size={10} /> Unlock
                                                </button>
                                                <button
                                                    onClick={() => onUpdate(u.id, { flagged: !u.flagged })}
                                                    className={`text-[8px] font-black uppercase tracking-widest transition-colors ${u.flagged ? 'text-amber-600' : 'text-slate-400 hover:text-amber-600'}`}
                                                >
                                                    {u.flagged ? 'Unflag' : 'Flag'}
                                                </button>
                                                <button
                                                    onClick={() => onUpdate(u.id, { active: !u.active })}
                                                    className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-all ${u.active ? 'text-slate-400 hover:text-red-600' : 'text-green-600'}`}
                                                >
                                                    {u.active ? <><UserX size={10} /> Deactivate</> : <><UserCheck size={10} /> Activate</>}
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
