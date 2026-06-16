import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { ANTI_CHEAT_VIOLATIONS } from '@/lib/constants';
import { Shield, AlertCircle } from 'lucide-react';

interface AntiCheatConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: Record<string, boolean>;
    onChange: (config: Record<string, boolean>) => void;
}

export const AntiCheatConfigModal: React.FC<AntiCheatConfigModalProps> = ({
    isOpen,
    onClose,
    config,
    onChange
}) => {
    if (!isOpen) return null;

    const toggleViolation = (key: string) => {
        onChange({
            ...config,
            [key]: !config[key]
        });
    };

    const toggleAll = (enabled: boolean) => {
        const newConfig: Record<string, boolean> = {};
        Object.keys(ANTI_CHEAT_VIOLATIONS).forEach(key => {
            newConfig[key] = enabled;
        });
        onChange(newConfig);
    };

    const getSeverityColor = (severity: number) => {
        if (severity >= 5) return 'text-red-600 bg-red-50 border-red-100';
        if (severity >= 4) return 'text-orange-600 bg-orange-50 border-orange-100';
        if (severity >= 3) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-blue-600 bg-blue-50 border-blue-100';
    };

    const getSeverityLabel = (severity: number) => {
        if (severity >= 5) return 'CRITICAL';
        if (severity >= 4) return 'HIGH';
        if (severity >= 3) return 'MEDIUM';
        return 'LOW';
    };

    return (
        <Modal
            title="Configure Anti-Cheat Violations"
            onClose={onClose}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex justify-end w-full">
                    <button onClick={onClose} className="btn-primary px-8 py-3 rounded-xl font-bold">
                        Save Configuration
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
                    <Shield className="text-blue-600 shrink-0" size={24} />
                    <div>
                        <p className="text-sm text-blue-800 font-medium">
                            Select which violations you want to monitor during this assessment.
                            Enabled violations will be logged and count towards the student's total violations.
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center px-2">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Violations List</h3>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => toggleAll(true)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                        >
                            Enable All
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleAll(false)}
                            className="text-xs font-bold text-slate-400 hover:underline"
                        >
                            Disable All
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {Object.entries(ANTI_CHEAT_VIOLATIONS).map(([key, info]) => (
                        <div
                            key={key}
                            onClick={() => toggleViolation(key)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                                config[key]
                                    ? 'border-blue-500 bg-blue-50/30'
                                    : 'border-slate-100 bg-white hover:border-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border ${getSeverityColor(info.severity)}`}>
                                    {info.score}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-slate-900">{info.label}</h4>
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${getSeverityColor(info.severity)}`}>
                                            {getSeverityLabel(info.severity)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{info.description}</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                config[key]
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-slate-200 group-hover:border-slate-300'
                            }`}>
                                {config[key] && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};
