import React, { useState } from 'react';
import { AssignmentDTO, SubmissionDTO, QuestionDTO } from '@/lib/types';
import { X, MessageCircle, FileText, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface FeedbackModalProps {
    assignment: AssignmentDTO;
    submission: SubmissionDTO;
    onClose: () => void;
}

const QuestionAccordionItem: React.FC<{
    q: QuestionDTO;
    idx: number;
    isOpen: boolean;
    onToggle: () => void;
    answer: string | number | boolean | undefined;
    feedback: string | undefined
}> = ({ q, idx, isOpen, onToggle, answer, feedback }) => {

    return (
        <div className="border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-colors">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-6 bg-white hover:bg-slate-50/50 transition-colors text-left"
            >
                <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Step {idx + 1}</div>
                    <h5 className="font-bold text-slate-800 text-sm line-clamp-1">{q.text}</h5>
                </div>
                <div className="flex items-center gap-4 ml-4">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase">{q.points} pts</span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {isOpen && (
                <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-slate-50 rounded-xl p-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Your Response</div>
                        {q.type === 'file' ? (
                            <a href={answer as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-bold">
                                <FileText size={16} /> View Uploaded File
                            </a>
                        ) : (
                            <div className="text-sm text-slate-700">{answer as string || <span className="italic text-slate-400 text-xs">No response provided</span>}</div>
                        )}
                    </div>

                    {feedback && (
                        <div className="flex gap-3 items-start bg-green-50/50 p-4 rounded-xl border border-green-100">
                            <div className="p-1 bg-green-100 text-green-600 rounded-lg shrink-0">
                                <CheckCircle2 size={14} />
                            </div>
                            <div className="text-xs text-green-800 leading-relaxed font-medium">
                                <span className="font-bold uppercase text-[9px] block mb-0.5">Instructor Insight</span>
                                {feedback}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ assignment, submission, onClose }) => {
    const [openQuestionId, setOpenQuestionId] = useState<string | null>(assignment.questions?.[0]?.id || null);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{assignment.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Feedback & Grade</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </header>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Overall Grade Card */}
                    <div className="bg-slate-900 rounded-3xl p-8 text-white flex items-center justify-between shadow-xl shadow-blue-500/10">
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Your Performance</div>
                            <div className="text-5xl font-black">{submission.final_grade ?? 0}%</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Points Earned</div>
                            <div className="text-2xl font-bold text-blue-400">{submission.grade ?? 0} / {assignment.points_possible}</div>
                        </div>
                    </div>

                    {/* Overall Feedback */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MessageCircle size={14} /> Instructor Comments
                        </h4>
                        <div className="bg-blue-50 text-blue-900 p-6 rounded-2xl border border-blue-100 text-sm leading-relaxed italic">
                            &ldquo;{submission.feedback || 'No overall feedback provided.'}&rdquo;
                        </div>
                    </div>

                    {/* Per-Question Feedback */}
                    {assignment.questions && assignment.questions.length > 0 && (
                        <div className="space-y-6">
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Question Breakdown</h4>
                             <div className="space-y-4">
                                 {assignment.questions.map((q: QuestionDTO, idx: number) => (
                                    <QuestionAccordionItem
                                        key={q.id || idx}
                                        q={q}
                                        idx={idx}
                                        isOpen={openQuestionId === q.id}
                                        onToggle={() => setOpenQuestionId(openQuestionId === q.id ? null : q.id)}
                                        answer={(submission).answers?.[q.id]}
                                        feedback={(submission).response_feedback?.[q.id]}
                                    />
                                ))}
                             </div>
                        </div>
                    )}
                </div>

                <footer className="p-8 bg-slate-50 border-t flex justify-end shrink-0">
                    <button onClick={onClose} className="btn-primary px-10 py-3 rounded-xl shadow-lg shadow-blue-500/20">Close Feedback</button>
                </footer>
            </div>
        </div>
    );
};
