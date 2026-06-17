import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/components/AppContext';
import { Search, MessageSquare, Send, CheckCircle, Clock, User, Mail, ShieldAlert } from 'lucide-react';
import { getSupportTickets, updateSupportTicket } from '@/lib/api-actions';
import { SupportTicketDTO } from '@/lib/types';

function AdminHelpPage() {
    const { addToast } = useAppContext();
    const [tickets, setTickets] = useState<SupportTicketDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicketDTO | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTickets = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSupportTickets();
            setTickets(data);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
            addToast('Error loading support tickets', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !replyText.trim()) return;

        setIsSubmitting(true);
        try {
            const updatedMetadata = {
                ...selectedTicket.metadata,
                reply: replyText
            };

            const response = await updateSupportTicket(selectedTicket.id, {
                status: 'resolved',
                resolved_at: new Date().toISOString(),
                metadata: updatedMetadata,
                version: selectedTicket.version
            });

            if (response.success) {
                addToast('Reply sent and ticket resolved!', 'success');
                setReplyText('');
                setSelectedTicket(null);
                fetchTickets();
            } else {
                addToast(response.error || 'Failed to send response', 'error');
            }
        } catch (err) {
            console.error('Failed to reply:', err);
            addToast('Failed to send response', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const markResolved = async (ticket: SupportTicketDTO) => {
        try {
            const response = await updateSupportTicket(ticket.id, {
                status: 'resolved',
                resolved_at: new Date().toISOString(),
                version: ticket.version
            });

            if (response.success) {
                addToast('Ticket marked as resolved', 'success');
                fetchTickets();
            } else {
                addToast(response.error || 'Update failed', 'error');
            }
        } catch (err) {
            console.error('Failed to resolve:', err);
            addToast('Update failed', 'error');
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-blue-600" size={32} />
                        Support Inbox
                    </h1>
                    <p className="text-slate-500 font-medium">Manage and respond to user concerns and bug reports.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search tickets, names, messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white shadow-sm"
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Tickets List */}
                <div className="lg:col-span-5 space-y-4">
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-3xl border-2 border-slate-50 animate-pulse" />)
                    ) : filteredTickets.length > 0 ? (
                        filteredTickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-200 group ${selectedTicket?.id === ticket.id ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-50 hover:border-blue-100 shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        {ticket.status === 'resolved' ?
                                            <CheckCircle size={16} className={selectedTicket?.id === ticket.id ? 'text-blue-200' : 'text-green-500'} /> :
                                            <Clock size={16} className={selectedTicket?.id === ticket.id ? 'text-blue-200' : 'text-amber-500'} />
                                        }
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedTicket?.id === ticket.id ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selectedTicket?.id === ticket.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {ticket.status.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="font-bold text-sm line-clamp-1 mb-1">{ticket.subject}</h3>
                                <div className={`text-xs ${selectedTicket?.id === ticket.id ? 'text-blue-100' : 'text-slate-500'} line-clamp-2 italic`}>
                                    &quot;{ticket.message}&quot;
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-current/10">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedTicket?.id === ticket.id ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {ticket.user?.full_name?.[0] || '?'}
                                    </div>
                                    <span className="text-[10px] font-bold">{ticket.user?.full_name || 'Unknown User'}</span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                            <MessageSquare className="mx-auto text-slate-200 mb-4" size={48} />
                            <h3 className="font-bold text-slate-400">No tickets found</h3>
                        </div>
                    )}
                </div>

                {/* Ticket Details & Reply */}
                <div className="lg:col-span-7">
                    {selectedTicket ? (
                        <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden sticky top-8">
                            <div className="p-8 md:p-10 space-y-8">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="text-2xl font-black text-slate-900">{selectedTicket.subject}</h2>
                                    {selectedTicket.status !== 'resolved' && (
                                        <button
                                            onClick={() => markResolved(selectedTicket)}
                                            className="px-6 py-2 bg-green-50 text-green-600 rounded-full text-xs font-black hover:bg-green-100 transition-colors uppercase tracking-widest"
                                        >
                                            Mark Resolved
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                        <User className="text-slate-400" size={18} />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">From</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedTicket.user?.full_name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                        <Mail className="text-slate-400" size={18} />
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                            <p className="text-sm font-bold text-slate-700">{selectedTicket.user?.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">User Message</h4>
                                    <div className="bg-slate-900 text-white p-8 rounded-[32px] text-sm leading-relaxed relative italic">
                                        <div className="absolute -top-3 left-8 bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">{selectedTicket.category || 'Inquiry'}</div>
                                        &quot;{selectedTicket.message}&quot;
                                    </div>
                                </div>

                                {selectedTicket.metadata?.reply ? (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Previous Response</h4>
                                        <div className="bg-blue-50 text-blue-800 p-8 rounded-[32px] text-sm border-2 border-blue-100">
                                            {selectedTicket.metadata.reply as string}
                                        </div>
                                    </div>
                                ) : null}

                                {selectedTicket.status !== 'resolved' && (
                                    <form onSubmit={handleReply} className="space-y-4 pt-4 border-t border-slate-100">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Send Response</h4>
                                        <textarea
                                            required
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Type your response here..."
                                            rows={5}
                                            className="w-full bg-white border-2 border-slate-100 rounded-3xl p-6 text-sm focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-200 disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Sending...' : (
                                                <>
                                                    <Send size={20} /> Send Response & Resolve
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 h-[600px] flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                                <MessageSquare className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Select a ticket to view details</h3>
                            <p className="text-slate-500 max-w-xs text-sm">Choose a conversation from the left to read the full inquiry and send a response.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


export const Route = createFileRoute('/admin/help')({
  head: () => ({ meta: [{ title: "Admin — Help — SmartLMS" }] }),
  component: AdminHelpPage,
});
