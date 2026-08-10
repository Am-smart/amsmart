import { createFileRoute } from '@tanstack/react-router';
import React, { useState } from 'react';
import { Check, Copy, Mail, UserPlus } from 'lucide-react';
import { InviteModal } from '@/components/users/InviteModal';
import { EmptyState } from '@/components/ui-legacy';

interface GeneratedInvite {
  id: string;
  role: string;
  link: string;
  createdAt: string;
}

function InvitesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invites, setInvites] = useState<GeneratedInvite[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (invite: GeneratedInvite) => {
    navigator.clipboard.writeText(invite.link);
    setCopiedId(invite.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invitations</h1>
          <p className="text-sm text-slate-500">Generate single-use signup links for admins, teachers, and students.</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} />
          New invite
        </button>
      </header>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Links generated this session</h2>
        {invites.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No invites generated yet"
            description="Invite links are single-use and shown only once — copy and share them right after generating."
            action={{ label: 'Generate invite', onClick: () => setIsModalOpen(true) }}
          />
        ) : (
          <ul className="space-y-3">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {invite.role} · {new Date(invite.createdAt).toLocaleTimeString()}
                  </p>
                  <p className="truncate text-sm text-slate-700">{invite.link}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(invite)}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {copiedId === invite.id ? <Check size={14} /> : <Copy size={14} />}
                  {copiedId === invite.id ? 'Copied' : 'Copy link'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInviteCreated={(role: string, link: string) =>
          setInvites((prev) => [
            { id: `${Date.now()}`, role, link, createdAt: new Date().toISOString() },
            ...prev,
          ])
        }
      />
    </div>
  );
}

export const Route = createFileRoute('/admin/invites')({
  head: () => ({
    meta: [
      { title: 'Admin — Invitations — SmartLMS' },
      { name: 'description', content: 'Create and copy single-use invitation links for new admins, teachers, and students.' },
    ],
  }),
  component: InvitesPage,
});
