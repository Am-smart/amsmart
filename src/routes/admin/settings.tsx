import { createFileRoute } from '@tanstack/react-router';

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { Settings, Shield, Bell, Save } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { updateSetting, getSettings } from '@/lib/api-actions';

function AdminSettingsPage() {
    const { user } = useAuth();
    const { addToast } = useAppContext();
    const [activeTab, setActiveTab] = useState<'security' | 'alerts' | 'api'>('security');
    const [config, setConfig] = useState<Record<string, boolean>>({
        requireVerification: true,
        publicRegistration: true,
        maintenanceBypass: false
    });
    const [alerts, setAlerts] = useState<Record<string, boolean>>({
        systemErrors: true,
        newUsers: false,
        securityBreach: true,
        databaseThreshold: true
    });
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({
        stripePublicKey: '',
        zoomSecret: '',
        smtpHost: 'smtp.smartlms.io'
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (key: string, value: unknown) => {
        setIsSaving(true);
        try {
            await updateSetting(key, value);
            addToast('Settings saved successfully!', 'success');
        } catch (err) {
            console.error('Save failed:', err);
            addToast('Failed to save settings.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Load from database on mount
    React.useEffect(() => {
        const loadConfigs = async () => {
            const allSettings = await getSettings();

            const globalData = allSettings.find((s: { key: string }) => s.key === 'global_config');
            if (globalData) setConfig(globalData.value as Record<string, boolean>);

            const alertsData = allSettings.find((s: { key: string }) => s.key === 'system_alerts');
            if (alertsData) setAlerts(alertsData.value as Record<string, boolean>);

            const apiData = allSettings.find((s: { key: string }) => s.key === 'api_keys');
            if (apiData) setApiKeys(apiData.value as Record<string, string>);
        };
        loadConfigs();
    }, []);

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Admin Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'security' ? 'bg-white shadow-sm text-red-600 border border-red-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                        <Shield size={18} /> Global Security
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'alerts' ? 'bg-white shadow-sm text-blue-600 border border-blue-100' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                        <Bell size={18} /> System Alerts
                    </button>
                    <button
                        onClick={() => setActiveTab('api')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'api' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:bg-white hover:shadow-sm'}`}>
                        <Settings size={18} /> API & Integration
                    </button>
                </div>

                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">System Preferences</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Global Administrative Access</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setConfig({...config, requireVerification: !config.requireVerification})}>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">Require Email Verification</div>
                                            <div className="text-xs text-slate-500">New users must verify their email.</div>
                                        </div>
                                        <input type="checkbox" checked={config.requireVerification} readOnly className="w-5 h-5 accent-red-600" />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setConfig({...config, publicRegistration: !config.publicRegistration})}>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">Public Registration</div>
                                            <div className="text-xs text-slate-500">Allow users to sign up without an invite.</div>
                                        </div>
                                        <input type="checkbox" checked={config.publicRegistration} readOnly className="w-5 h-5 accent-red-600" />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setConfig({...config, maintenanceBypass: !config.maintenanceBypass})}>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">Maintenance Bypass</div>
                                            <div className="text-xs text-slate-500">Allow VIP users to bypass maintenance mode.</div>
                                        </div>
                                        <input type="checkbox" checked={config.maintenanceBypass} readOnly className="w-5 h-5 accent-red-600" />
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <button
                                        onClick={() => handleSave('global_config', config)}
                                        disabled={isSaving}
                                        className="btn-primary bg-red-600 hover:bg-red-700 w-full md:w-auto px-8 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        {isSaving ? 'Saving...' : 'Save Security Settings'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'alerts' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">🔔</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">System Alerts</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Admin Notification Controls</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {Object.entries(alerts).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer" onClick={() => setAlerts({...alerts, [key]: !value})}>
                                            <div className="capitalize">
                                                <div className="font-bold text-slate-900 text-sm">{key.replace(/([A-Z])/g, ' $1')}</div>
                                                <div className="text-xs text-slate-500">Receive alerts for {key.toLowerCase()}.</div>
                                            </div>
                                            <input type="checkbox" checked={value as boolean} readOnly className="w-5 h-5 accent-blue-600" />
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-6 border-t">
                                    <button
                                        onClick={() => handleSave('system_alerts', alerts)}
                                        disabled={isSaving}
                                        className="btn-primary bg-blue-600 hover:bg-blue-700 w-full md:w-auto px-8 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        {isSaving ? 'Saving...' : 'Save Alert Settings'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'api' && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-20 h-20 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center text-3xl">🔌</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Integrations</h3>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">External Service Connectivity</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Stripe Public Key</label>
                                        <input
                                            type="text"
                                            value={apiKeys.stripePublicKey}
                                            onChange={e => setApiKeys({...apiKeys, stripePublicKey: e.target.value})}
                                            className="input-custom font-mono text-xs"
                                            placeholder="pk_test_..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">Zoom API Secret</label>
                                        <input
                                            type="password"
                                            value={apiKeys.zoomSecret}
                                            onChange={e => setApiKeys({...apiKeys, zoomSecret: e.target.value})}
                                            className="input-custom font-mono text-xs"
                                            placeholder="••••••••••••••••"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-2">SMTP Relay Host</label>
                                        <input
                                            type="text"
                                            value={apiKeys.smtpHost}
                                            onChange={e => setApiKeys({...apiKeys, smtpHost: e.target.value})}
                                            className="input-custom text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <button
                                        onClick={() => handleSave('api_keys', apiKeys)}
                                        disabled={isSaving}
                                        className="btn-primary bg-slate-900 hover:bg-black w-full md:w-auto px-8 flex items-center justify-center gap-2"
                                    >
                                        <Save size={18} />
                                        {isSaving ? 'Saving...' : 'Save Integration Settings'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


export const Route = createFileRoute('/admin/settings')({
  head: () => ({ meta: [{ title: "Admin — Settings — SmartLMS" }] }),
  component: AdminSettingsPage,
});
