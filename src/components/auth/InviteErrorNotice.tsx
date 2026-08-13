import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { INVITE_ERROR_CONTENT, type InviteErrorCode } from '@/lib/auth/invite-errors';

interface InviteErrorNoticeProps {
  code: InviteErrorCode;
  onClose: () => void;
  onSignIn: () => void;
}

export const InviteErrorNotice: React.FC<InviteErrorNoticeProps> = ({ code, onClose, onSignIn }) => {
  const { title, description } = INVITE_ERROR_CONTENT[code];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="invite-error-title"
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 p-4"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
        >
          <X size={18} />
        </button>

        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle size={24} />
        </div>

        <h2 id="invite-error-title" className="text-lg font-black text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onSignIn} className="btn-primary flex-1 py-3 text-xs font-bold uppercase tracking-widest">
            Sign in instead
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:bg-slate-50"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
};
