import React, { useState } from 'react';
import { UserDTO } from '@/lib/types';
import { User } from '@/lib/types';
import { Bell, User as UserIcon, Lock, Save, Globe } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { updatePassword, updatePreferences } from '@/lib/api-actions';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface StudentSettingsProps {
    user: UserDTO;
    onUpdate: (updates: Partial<User>) => Promise<void>;
}

export const StudentSettings: React.FC<StudentSettingsProps> = ({ user, onUpdate }) => {
    const { addToast } = useAppContext();
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        phone: user.phone || '',
    });
    const [notificationPreferences, setNotificationPreferences] = useState<Record<string, boolean>>(user.notification_preferences || {
        email: true,
        push: true,
        inApp: true
    });
    const [securityData, setSecurityData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const { isSupported, subscription, subscribe, unsubscribe, isLoading: isPushLoading } = usePushNotifications();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onUpdate(formData);
            addToast('Settings updated successfully!', 'success');
        } catch (err) {
            console.error('Update failed:', err);
            addToast('Failed to update settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        try {
            const res = await updatePreferences(notificationPreferences);
            if (res.success) {
                addToast('Notification preferences saved', 'success');
                await onUpdate({ notification_preferences: notificationPreferences });
            } else {
                throw new Error(res.error);
            }
        } catch (error: unknown) {
            const err = error as Error;
            addToast(err.message || 'Failed to save preferences', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (securityData.new_password !== securityData.confirm_password) {
            addToast('Passwords do not match', 'error');
            return;
        }
        if (securityData.new_password.length < 8) {
            addToast('Password must be at least 8 characters', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const res = await updatePassword(securityData.current_password, securityData.new_password);
            if (res.success) {
                addToast('Password updated successfully', 'success');
                setSecurityData({ current_password: '', new_password: '', confirm_password: '' });
            } else {
                throw new Error(res.error);
            }
        } catch (error: unknown) {
            const err = error as Error;
            addToast(err.message || 'Failed to update password', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-2">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                        <UserIcon size={18} /> Profile Info
                    </button>
                    <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'notifications' ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                        <Bell size={18} /> Notifications
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'security' ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                        <Lock size={18} /> Security
                    </button>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl">🎓</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{user.email}</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Student Account</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.full_name}
                                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <button type="submit" disabled={isSaving} className="btn-primary w-full md:w-auto px-8 flex items-center justify-center gap-2">
                                        <Save size={18} />
                                        {isSaving ? 'Saving Changes...' : 'Save Settings'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div className="mb-8">
                                    <h3 className="font-bold text-slate-900 text-lg">Notification Preferences</h3>
                                    <p className="text-sm text-slate-600 mt-2">Choose how you want to receive updates</p>
                                </div>

                                <div className="space-y-4">
                                    {Object.entries(notificationPreferences).map(([key, value]) => (
                                        <label key={key} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={() => setNotificationPreferences({...notificationPreferences, [key]: !value})}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700 flex-1">
                                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {isSupported && (
                                    <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 bg-blue-600 text-white rounded-xl">
                                                <Globe size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">Web Push Notifications</h4>
                                                <p className="text-xs text-slate-500">Receive real-time updates directly on your device</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={subscription ? unsubscribe : subscribe}
                                            disabled={isPushLoading}
                                            className={`w-full p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                                                subscription
                                                    ? 'bg-white text-red-600 border border-red-100 hover:bg-red-50'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100'
                                            }`}
                                        >
                                            {isPushLoading ? 'Processing...' : (subscription ? 'Disable Push Notifications' : 'Enable Push Notifications')}
                                        </button>
                                    </div>
                                )}

                                <div className="pt-6 border-t">
                                    <button 
                                        onClick={handleSavePreferences}
                                        disabled={isSaving}
                                        className="btn-primary w-full md:w-auto px-8 flex items-center justify-center gap-2">
                                        <Save size={18} />
                                        {isSaving ? 'Saving...' : 'Save Preferences'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="mb-8">
                                    <h3 className="font-bold text-slate-900 text-lg">Security Settings</h3>
                                    <p className="text-sm text-slate-600 mt-2">Manage your account security and password</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={securityData.current_password}
                                            onChange={e => setSecurityData({...securityData, current_password: e.target.value})}
                                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Enter your current password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={securityData.new_password}
                                            onChange={e => setSecurityData({...securityData, new_password: e.target.value})}
                                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Enter a new password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={securityData.confirm_password}
                                            onChange={e => setSecurityData({...securityData, confirm_password: e.target.value})}
                                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Confirm your new password"
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                                    <p className="text-sm text-blue-900">Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.</p>
                                </div>

                                <div className="pt-6 border-t">
                                    <button 
                                        onClick={handleUpdatePassword}
                                        disabled={isSaving}
                                        className="btn-primary w-full md:w-auto px-8 flex items-center justify-center gap-2">
                                        <Save size={18} />
                                        {isSaving ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
