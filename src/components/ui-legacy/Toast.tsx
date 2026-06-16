import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'online' | 'offline';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 max-w-md w-full sm:w-auto pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
                </div>
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(onRemove, toast.duration || 5000);
        return () => clearTimeout(timer);
    }, [toast.duration, onRemove]);

    const icons = {
        success: <CheckCircle className="text-green-500" size={20} />,
        error: <AlertCircle className="text-red-500" size={20} />,
        info: <Info className="text-blue-500" size={20} />,
        online: <Wifi className="text-green-500" size={20} />,
        offline: <WifiOff className="text-slate-500" size={20} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-100',
        error: 'bg-red-50 border-red-100',
        info: 'bg-blue-50 border-blue-100',
        online: 'bg-green-50 border-green-100',
        offline: 'bg-slate-50 border-slate-100'
    };

    return (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border shadow-xl animate-in slide-in-from-right-10 duration-300 ${bgColors[toast.type]}`}>
            <div className="shrink-0">{icons[toast.type]}</div>
            <p className="text-sm font-bold text-slate-800 flex-1">{toast.message}</p>
            <button onClick={onRemove} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
            </button>
        </div>
    );
};
