import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, HelpCircle, Book, MessageSquare, Shield, ChevronDown, ChevronUp, Send, LifeBuoy, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { useAuth } from '@/components/auth/AuthContext';
import { saveSupportTicket, getSupportTickets } from '@/lib/api-actions';
import { SupportTicketDTO } from '@/lib/types';

const FAQ_DATA = [
    {
        category: 'Account',
        questions: [
            { q: "How do I reset my password?", a: "You can request a password reset from the login page. An administrator will review your request and provide a temporary password if approved." },
            { q: "Can I change my email address?", a: "Email addresses are currently locked to your initial registration for security reasons. Please contact support if you need a change." },
            { q: "How do I earn XP?", a: "XP is earned by completing lessons, submitting assignments, and passing quizzes. Longer study sessions also contribute to your XP." }
        ]
    },
    {
        category: 'Courses',
        questions: [
            { q: "How do I enroll in a course?", a: "Browse the 'Courses' catalog and click the 'Enroll' button on any course you're interested in." },
            { q: "Where can I find my course materials?", a: "Course materials like PDFs and lecture notes are available in the 'Materials' tab within each course view." },
            { q: "How is my progress calculated?", a: "Your progress is based on the number of lessons you have marked as complete relative to the total number of lessons in the course." }
        ]
    },
    {
        category: 'Technical',
        questions: [
            { q: "Does SmartLMS work offline?", a: "Yes! Many features like viewing cached content, drafting assignments, and planning your study work offline. Your changes will sync when you're back online." },
            { q: "What file types are supported for assignments?", a: "We support PDF, DOCX, ZIP, and most common image formats. Specific assignments may have more restricted requirements." },
            { q: "Why can't I access a live class?", a: "Live classes only become accessible shortly before their scheduled start time. Ensure you are enrolled in the course to join." }
        ]
    }
];

function HelpPage() {
    const { addToast } = useAppContext();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contactForm, setContactForm] = useState({ subject: '', message: '' });
    const [tickets, setTickets] = useState<SupportTicketDTO[]>([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(true);

    const fetchTickets = useCallback(async () => {
        if (!user) return;
        setIsLoadingTickets(true);
        try {
            const data = await getSupportTickets({ user_id: user.id });
            setTickets(data);
        } catch (err) {
            console.error('Failed to fetch tickets:', err);
        } finally {
            setIsLoadingTickets(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const filteredFaqs = useMemo(() => {
        if (!searchQuery) return FAQ_DATA;
        return FAQ_DATA.map(cat => ({
            ...cat,
            questions: cat.questions.filter(q =>
                q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0);
    }, [searchQuery]);

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.subject || !contactForm.message) return;

        setIsSubmitting(true);
        try {
            const response = await saveSupportTicket({
                subject: contactForm.subject,
                message: contactForm.message,
                category: 'technical',
                priority: 'medium'
            });

            if (response.success) {
                addToast('Support request sent! Our team will get back to you soon.', 'success');
                setContactForm({ subject: '', message: '' });
                fetchTickets();
            } else {
                addToast(response.error || 'Failed to send support request', 'error');
            }
        } catch (err) {
            console.error('Support request failed:', err);
            addToast('Failed to send support request. Please try again later.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFaq = (catIdx: number, qIdx: number) => {
        const id = `${catIdx}-${qIdx}`;
        setOpenIndex(openIndex === id ? null : id);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-2">
                    <LifeBuoy size={32} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">How can we help you?</h1>
                <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                    Find answers to common questions or reach out to our technical support team for personalized assistance.
                </p>

                <div className="relative max-w-xl mx-auto mt-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search for topics, features, or questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FAQ Section */}
                <div className="lg:col-span-2 space-y-12">
                    {/* Recent Tickets Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="text-amber-500" size={24} />
                                <h2 className="text-xl font-bold text-slate-900">Your Recent Requests</h2>
                            </div>
                            <button
                                onClick={fetchTickets}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                            >
                                Refresh
                            </button>
                        </div>

                        {isLoadingTickets ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />)}
                            </div>
                        ) : tickets.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tickets.slice(0, 4).map(ticket => (
                                    <div key={ticket.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                                                ticket.status === 'resolved' ? 'bg-green-50 text-green-600' :
                                                ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                                                'bg-amber-50 text-amber-600'
                                            }`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{ticket.subject}</h4>
                                        {ticket.metadata?.reply ? (
                                            <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CheckCircle size={12} className="text-blue-600" />
                                                    <span className="text-[10px] font-black text-blue-600 uppercase">Support Response</span>
                                                </div>
                                                <p className="text-xs text-blue-800 line-clamp-2 italic">&quot;{ticket.metadata.reply as string}&quot;</p>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-100 text-center">
                                <p className="text-sm text-slate-400 font-medium italic">No recent support requests.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <HelpCircle className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
                        </div>
                    </div>

                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((category, catIdx) => (
                            <div key={category.category} className="space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">
                                    {category.category}
                                </h3>
                                <div className="space-y-3">
                                    {category.questions.map((faq, qIdx) => {
                                        const isOpen = openIndex === `${catIdx}-${qIdx}`;
                                        return (
                                            <div
                                                key={qIdx}
                                                className={`bg-white rounded-2xl border transition-all duration-200 ${isOpen ? 'border-blue-200 shadow-md ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
                                            >
                                                <button
                                                    onClick={() => toggleFaq(catIdx, qIdx)}
                                                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                                                >
                                                    <span className="font-bold text-slate-800 pr-4">{faq.q}</span>
                                                    {isOpen ? <ChevronUp className="text-blue-500 shrink-0" size={20} /> : <ChevronDown className="text-slate-400 shrink-0" size={20} />}
                                                </button>
                                                {isOpen && (
                                                    <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed animate-in slide-in-from-top-2 duration-200">
                                                        <div className="pt-2 border-t border-slate-50">
                                                            {faq.a}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="font-bold text-slate-900">No results found</h3>
                            <p className="text-sm text-slate-500 mt-1">Try adjusting your search keywords.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Section */}
                <div className="space-y-8">
                    {/* Contact Form */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <MessageSquare size={120} />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold">Contact Support</h3>
                                <p className="text-slate-400 text-xs mt-2 font-medium">Expected response time: Under 24 hours</p>
                            </div>

                            <form onSubmit={handleSupportSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={contactForm.subject}
                                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                                        placeholder="e.g. Access issue"
                                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Message</label>
                                    <textarea
                                        required
                                        value={contactForm.message}
                                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                                        placeholder="Describe your problem in detail..."
                                        rows={4}
                                        className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-slate-600"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Sending...' : (
                                        <>
                                            <Send size={18} /> Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                        <h3 className="font-bold text-slate-900">Quick Resources</h3>
                        <div className="space-y-2">
                            <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100">
                                    <Book size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Student Guide</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100">
                                    <Shield size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Privacy Policy</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


export const Route = createFileRoute('/student/help')({
  head: () => ({ meta: [{ title: "Student — Help — SmartLMS" }] }),
  component: HelpPage,
});
