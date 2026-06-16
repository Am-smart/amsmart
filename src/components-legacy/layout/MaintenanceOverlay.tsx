"use client";

import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';

interface MaintenanceOverlayProps {
  message?: string;
  onLogout: () => void;
}

export const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({
  message = "System is undergoing maintenance.",
  onLogout
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md px-4">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg w-full text-center border border-slate-100">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
          <ShieldAlert size={48} className="text-red-600" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
          System Maintenance
        </h2>

        <p className="text-slate-600 mb-8 leading-relaxed text-lg">
          {message}
        </p>

        <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                <p className="text-sm text-slate-500 font-medium">
                    Please try again later. If you believe this is an error, contact support.
                </p>
            </div>

            <button
                onClick={onLogout}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
                <LogOut size={20} />
                Return to Login
            </button>
        </div>
      </div>
    </div>
  );
};
