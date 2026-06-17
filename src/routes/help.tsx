import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useMemo } from 'react';
import { Search, HelpCircle, Book, MessageSquare, Shield, ChevronDown, ChevronUp, LifeBuoy, GraduationCap, ShieldAlert } from 'lucide-react';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';
import Link from '@/lib/next-compat';

const GENERAL_FAQ = [
    {
        category: 'General',
        questions: [
            { q: "What is SmartLMS?", a: "SmartLMS is a comprehensive learning management system designed to make education accessible, interactive, and efficient for both students and instructors." },
            { q: "How do I create an account?", a: "You can sign up as a student or teacher from the landing page. Click 'Get Started' to begin the registration process." },
            { q: "Is there a mobile app?", a: "SmartLMS is a Progressive Web App (PWA) that works perfectly on mobile browsers and can be installed on your home screen for an app-like experience." }
        ]
    },
    {
        category: 'Security & Privacy',
        questions: [
            { q: "Is my data secure?", a: "We use industry-standard encryption and security practices to protect your personal information and academic records." },
            { q: "Who can see my grades?", a: "Only you, your course instructors, and system administrators have access to your individual grades." }
        ]
    }
];

function GeneralHelpPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openIndex, setOpenIndex] = useState<string | null>(null);

    const filteredFaqs = useMemo(() => {
        if (!searchQuery) return GENERAL_FAQ;
        return GENERAL_FAQ.map(cat => ({
            ...cat,
            questions: cat.questions.filter(q =>
                q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
            )
        })).filter(cat => cat.questions.length > 0);
    }, [searchQuery]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <LandingHeader onSignIn={() => window.location.href = '/'} onGetStarted={() => window.location.href = '/'} />

            <main className="flex-grow pt-24 pb-20 px-4 sm:px-[5%]">
                <div className="max-w-5xl mx-auto space-y-12">
                    {/* Header Section */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-2">
                            <HelpCircle size={32} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Help Center</h1>
                        <p className="text-slate-500 max-w-2xl mx-auto font-medium">
                            Find answers to common questions about the SmartLMS platform.
                        </p>

                        <div className="relative max-w-xl mx-auto mt-8">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search for help..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all shadow-sm bg-white"
                            />
                        </div>
                    </div>

                    {/* Role Specific Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/student/help" className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <LifeBuoy size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Student Help</h3>
                            <p className="text-sm text-slate-500 font-medium">FAQs and support for students regarding courses and assignments.</p>
                        </Link>

                        <Link href="/teacher/help" className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <GraduationCap size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Teacher Help</h3>
                            <p className="text-sm text-slate-500 font-medium">Resources for instructors to manage courses and grade students.</p>
                        </Link>

                        <Link href="/admin/help" className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShieldAlert size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Admin Support</h3>
                            <p className="text-sm text-slate-500 font-medium">Management tools and system configuration assistance.</p>
                        </Link>
                    </div>

                    {/* FAQ Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {filteredFaqs.map((category, catIdx) => (
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
                                                        onClick={() => setOpenIndex(isOpen ? null : `${catIdx}-${qIdx}`)}
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
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter onRoleSelect={() => window.location.href = '/'} />
        </div>
    );
}


export const Route = createFileRoute('/help')({
  head: () => ({ meta: [{ title: "Help — SmartLMS" }] }),
  component: GeneralHelpPage,
});
