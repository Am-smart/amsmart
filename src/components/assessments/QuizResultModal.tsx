import React from 'react';
import { QuizDTO, QuizSubmissionDTO } from '@/lib/types';
import { X, Clock, Target, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuizResultModalProps {
    quiz: QuizDTO;
    submission: QuizSubmissionDTO;
    onClose: () => void;
}

export const QuizResultModal: React.FC<QuizResultModalProps> = ({ quiz, submission, onClose }) => {
    const questions = quiz.questions || [];
    const answers = (submission).answers as Record<string, unknown> || {};

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4">
            <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                <header className="p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{quiz.title}</h2>
                        <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest mt-1 w-fit">Attempt Details</div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                </header>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Target size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Your Score</span>
                            </div>
                            <div className="text-4xl font-black">{submission.score}%</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-bold">Passing: {quiz.passing_score}%</div>
                        </div>
                        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl">
                            <div className="flex items-center gap-2 text-blue-200 mb-2">
                                <Clock size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Time Spent</span>
                            </div>
                            <div className="text-4xl font-black">{Math.floor(submission.time_spent / 60)}m {submission.time_spent % 60}s</div>
                            <div className="text-[10px] text-blue-200 mt-1 font-bold">Limit: {quiz.time_limit}m</div>
                        </div>
                    </div>

                    {/* Question Breakdown */}
                    <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Submission Analysis</h4>
                        <div className="space-y-4">
                            {questions.map((q, idx) => {
                                const studentAnswer = answers[q.id];
                                const isCorrect = studentAnswer == q.correct_answer;

                                return (
                                    <div key={q.id} className={`p-6 rounded-2xl border-2 transition-all ${isCorrect ? 'border-green-50 bg-green-50/20' : 'border-red-50 bg-red-50/20'}`}>
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="flex-1">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Question {idx + 1}</div>
                                                <h5 className="font-bold text-slate-800 text-sm leading-relaxed">{q.text}</h5>
                                            </div>
                                            {isCorrect ?
                                                <CheckCircle2 className="text-green-500 shrink-0" size={20} /> :
                                                <AlertCircle className="text-red-500 shrink-0" size={20} />
                                            }
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/60 p-3 rounded-xl">
                                                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Your Answer</div>
                                                <div className={`text-xs font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{(studentAnswer as React.ReactNode) || 'Skipped'}</div>
                                            </div>
                                            <div className="bg-white/60 p-3 rounded-xl">
                                                <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Correct Answer</div>
                                                <div className="text-xs font-bold text-slate-700">{q.correct_answer as React.ReactNode}</div>
                                            </div>
                                        </div>

                                        {q.explanation && (
                                            <div className="mt-4 pt-4 border-t border-slate-100/50 text-[11px] text-slate-500 leading-relaxed italic">
                                                <strong>Teacher Insight:</strong> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <footer className="p-8 bg-slate-50 border-t flex justify-end shrink-0">
                    <button onClick={onClose} className="btn-primary px-10 py-3 rounded-xl shadow-lg shadow-blue-500/20">Close Details</button>
                </footer>
            </div>
        </div>
    );
};
