import React, { useState, useMemo } from 'react';
import { SubmissionDTO, QuestionDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { gradeSubmission } from '@/lib/api-actions';
import { Modal } from '@/components/ui-legacy/Modal';

type RawAnswer = string | number | boolean | { mode: 'essay' | 'file' | 'link'; value: string } | undefined;

const normalizeAnswer = (a: RawAnswer, fallbackType?: string): { mode: string; value: string } => {
    if (a && typeof a === 'object' && 'mode' in a) return { mode: a.mode, value: a.value };
    return { mode: fallbackType || 'essay', value: a === undefined || a === null ? '' : String(a) };
};

// Validate URL format for link submissions
const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Check if a value is a valid file URL (should start with http/https or be a data URL)
const isFileUrl = (value: string): boolean => {
    return /^(https?:|data:)/.test(value);
};

interface GradingModalProps {
    submission: SubmissionDTO;
    onSave: () => void;
    onCancel: () => void;
}

export const GradingModal: React.FC<GradingModalProps> = ({ submission, onSave, onCancel }) => {
    const { addToast } = useAppContext();

    const { dueDate, submittedAt, isLate, daysLate, calculatedPenalty } = useMemo(() => {
        const dDate = submission.assignment?.due_date ? new Date(submission.assignment.due_date) : null;
        const sAt = new Date(submission.submitted_at);
        const late = !!(dDate && sAt > dDate);
        const dLate = late ? Math.floor((sAt.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        const penalty = late ? dLate * (submission.assignment?.late_penalty_per_day || 0) : 0;
        return { dueDate: dDate, submittedAt: sAt, isLate: late, daysLate: dLate, calculatedPenalty: penalty };
    }, [submission]);

    const questions = submission.assignment?.questions || [];

    // Validate question IDs are unique and present
    if (questions.length > 0) {
        const questionIds = questions.map(q => q.id);
        const uniqueIds = new Set(questionIds);
        if (uniqueIds.size !== questionIds.length) {
            console.error('[v0] Duplicate question IDs detected:', questionIds);
        }
        if (questionIds.some(id => !id || typeof id !== 'string')) {
            console.error('[v0] Invalid question IDs found:', questionIds);
        }
    }

    // Local string state so users can freely clear/type in score inputs
    // without values snapping back to 0 mid-edit.
    const [scoreInputs, setScoreInputs] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        questions.forEach((q) => {
            if (!q.id) {
                console.error('[v0] Question missing ID:', q);
                return;
            }
            const v = submission.question_scores?.[q.id];
            initial[q.id] = v === undefined || v === null ? '' : String(v);
        });
        return initial;
    });
    const [formData, setFormData] = useState({
        feedback: submission.feedback || '',
        regrade_feedback: '',
        response_feedback: submission.response_feedback || {},
    });
    const [isSaving, setIsSaving] = useState(false);
    const [savingMode, setSavingMode] = useState<'draft' | 'final' | null>(null);
    const [regradeStatus, setRegradeStatus] = useState<'pending' | 'resolved'>(submission.regrade_request ? 'pending' : 'resolved');

    const pointsPossible = submission.assignment?.points_possible || 100;

    // Numeric map of scores actually entered for CURRENT questions only.
    const questionScores = useMemo(() => {
        const map: Record<string, number> = {};
        questions.forEach((q) => {
            const raw = scoreInputs[q.id];
            if (raw === undefined || raw === '') return;
            const n = Number(raw);
            if (!Number.isFinite(n)) return;
            map[q.id] = n;
        });
        return map;
    }, [scoreInputs, questions]);

    const { rawGrade, rawPercentage, finalGrade, allScored } = useMemo(() => {
        const raw = Object.values(questionScores).reduce((a, b) => a + b, 0);
        const rawPerc = pointsPossible > 0 ? Math.round((raw / pointsPossible) * 100) : 0;
        const final = Math.max(0, rawPerc - calculatedPenalty);
        const scored = questions.length === 0 || questions.every((q) => scoreInputs[q.id] !== undefined && scoreInputs[q.id] !== '');
        return { rawGrade: raw, rawPercentage: rawPerc, finalGrade: final, allScored: scored };
    }, [questionScores, pointsPossible, calculatedPenalty, questions, scoreInputs]);

    const persist = async (mode: 'draft' | 'final') => {
        setIsSaving(true);
        setSavingMode(mode);
        try {
            // Prune empty response feedback entries - preserve only non-empty per-question feedback
            const responseFeedback: Record<string, string> = {};
            Object.entries(formData.response_feedback).forEach(([k, v]) => {
                if (typeof v === 'string' && v.trim() !== '') responseFeedback[k] = v;
            });

            // Ensure only scored questions are in the final question_scores object
            const finalQuestionScores: Record<string, number> = {};
            questions.forEach((q) => {
                const score = questionScores[q.id];
                if (score !== undefined && !isNaN(score)) {
                    finalQuestionScores[q.id] = score;
                }
            });

            // When using per-question scoring, don't send grade - let backend calculate from question_scores
            // This prevents mismatch errors when question IDs change or questions are reordered
            const gradeData: Partial<SubmissionDTO> = {
                feedback: formData.feedback,
                response_feedback: responseFeedback,
                question_scores: finalQuestionScores,
            };
            
            // Only include grade if not using question_scores or if using draft mode
            if (Object.keys(finalQuestionScores).length === 0) {
                gradeData.grade = rawGrade;
            }

            if (mode === 'final' && questions.length > 0 && !allScored) {
                addToast('Please score every question before submitting the final grade.', 'error');
                return;
            }

            if (mode === 'final' && submission.regrade_request && regradeStatus === 'resolved') {
                if (!formData.regrade_feedback.trim()) {
                    addToast('Please provide a regrade response explanation.', 'error');
                    return;
                }
                gradeData.regrade_request = null;
                gradeData.feedback = `${formData.feedback}\n\n[Regrade Response]: ${formData.regrade_feedback}`;
            }

            const res = await gradeSubmission(submission.id, gradeData, { draft: mode === 'draft' });
            if (!res.success) throw new Error(res.error || 'Failed to save');

            addToast(mode === 'draft' ? 'Draft saved.' : 'Grade saved successfully!', 'success');
            onSave();
        } catch (err) {
            console.error('Grading failed:', err);
            addToast(mode === 'draft' ? 'Failed to save draft.' : 'Failed to save grade.', 'error');
        } finally {
            setIsSaving(false);
            setSavingMode(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void persist('final');
    };

    return (
        <Modal
            title="Grade Submission"
            onClose={onCancel}
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 w-full">
                    <button type="button" onClick={onCancel} disabled={isSaving} className="btn-secondary w-full sm:flex-1 py-3 sm:py-4 text-sm">Discard</button>
                    <button type="button" onClick={() => void persist('draft')} disabled={isSaving} className="btn-secondary w-full sm:flex-1 py-3 sm:py-4 text-sm">
                        {savingMode === 'draft' ? 'Saving Draft...' : 'Save Draft'}
                    </button>
                    <button type="submit" disabled={isSaving} className="btn-primary w-full sm:flex-1 py-3 sm:py-4 text-sm">
                        {savingMode === 'final' ? 'Saving Grade...' : 'Save Grade & Return'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {gradedGroup && (
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                        <Users size={18} className="text-indigo-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-indigo-900">
                            <div className="text-xs font-black uppercase tracking-widest text-indigo-700">
                                Group submission — {gradedGroup.name}
                            </div>
                            <p className="mt-1">
                                This grade and feedback apply to all {gradedGroup.member_ids.length} group member
                                {gradedGroup.member_ids.length === 1 ? '' : 's'}
                                {gradedGroup.leader_id ? ' and only the leader can request a regrade.' : '.'}
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-blue-50 p-3 sm:p-4 md:p-6 rounded-2xl border border-blue-100 space-y-4">
                        <h4 className="text-xs sm:text-sm font-bold text-blue-700 uppercase mb-2">Student Submission</h4>

                        {(submission).answers && Object.keys((submission).answers as Record<string, unknown>).length > 0 ? (
                            <div className="space-y-4">
                                {submission.assignment?.questions.map((q: QuestionDTO, idx: number) => {
                                    const raw = (submission).answers?.[q.id] as RawAnswer;
                                    const { mode, value } = normalizeAnswer(raw, q.type);
                                    return (
                                    <div key={`question-${q.id}`} className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-blue-100/50 space-y-4">
                                        <div>
                                            <div className="text-[8px] sm:text-[10px] md:text-sm font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <span>Step {idx + 1}: {(q).text}</span>
                                                <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full normal-case tracking-normal">{mode}</span>
                                            </div>
                                            <div className="text-xs sm:text-sm text-slate-800">
                                                {mode === 'file' ? (
                                                    value && isFileUrl(value) ? (
                                                        <div className="flex items-center gap-2">
                                                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold flex-1 break-all">View Uploaded File</a>
                                                            <span className="text-[9px] text-slate-400 font-medium">File</span>
                                                        </div>
                                                    ) : (
                                                        <span className="italic text-slate-400">No file uploaded</span>
                                                    )
                                                ) : mode === 'link' ? (
                                                    value && isValidUrl(value) ? (
                                                        <div className="flex items-center gap-2">
                                                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold flex-1 break-all">{value}</a>
                                                            <span className="text-[9px] text-slate-400 font-medium">Link</span>
                                                        </div>
                                                    ) : value ? (
                                                        <span className="text-red-600 font-bold">Invalid URL: {value}</span>
                                                    ) : (
                                                        <span className="italic text-slate-400">No link provided</span>
                                                    )
                                                ) : (
                                                    <div className="whitespace-pre-line">{value || <span className="italic text-slate-400">No response</span>}</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-blue-100/50 space-y-3">
                                            <div>
                                                <label className="text-[8px] sm:text-[10px] md:text-sm font-bold text-blue-400 uppercase tracking-widest block mb-1">Per-Question Feedback</label>
                                                <input
                                                    type="text"
                                                    value={formData.response_feedback[q.id] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        response_feedback: { ...formData.response_feedback, [q.id]: e.target.value }
                                                    })}
                                                    placeholder="Provide specific feedback on this response..."
                                                    className="w-full bg-white/80 border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] sm:text-[10px] md:text-sm font-bold text-blue-400 uppercase tracking-widest block mb-1">Points Earned</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                     type="number"
                                                     inputMode="decimal"
                                                     min={0}
                                                     max={q.points ?? undefined}
                                                     value={scoreInputs[q.id] ?? ''}
                                                     onChange={(e) => {
                                                         const raw = e.target.value;
                                                         if (raw === '') {
                                                             setScoreInputs((prev) => ({ ...prev, [q.id]: '' }));
                                                             return;
                                                         }
                                                         const n = Number(raw);
                                                         if (!Number.isFinite(n)) return;
                                                         const max = q.points ?? Infinity;
                                                         const clamped = Math.max(0, Math.min(max, n));
                                                         setScoreInputs((prev) => ({ ...prev, [q.id]: String(clamped) }));
                                                     }}
                                                        className="flex-1 bg-white/80 border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-400 outline-none font-bold"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">out of {q.points}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{submission.submission_text || 'No text provided.'}</div>
                        )}

                        {submission.file_url && (
                            <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary py-2 px-4 text-xs mt-4 block w-fit">View Main Attachment</a>
                        )}
                    </div>

                    {submission.regrade_request && (
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-amber-700 uppercase">Regrade Request</h4>
                                <select
                                    value={regradeStatus}
                                    onChange={(e) => setRegradeStatus(e.target.value as 'pending' | 'resolved')}
                                    className="text-xs font-bold p-1 rounded border border-amber-200 bg-white"
                                >
                                    <option value="pending">Keep Pending</option>
                                    <option value="resolved">Mark Resolved</option>
                                </select>
                            </div>
                            <div className="text-sm text-amber-900 leading-relaxed italic">&ldquo;{submission.regrade_request}&rdquo;</div>

                            {regradeStatus === 'resolved' && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-bold text-amber-600 uppercase">Regrade Response</label>
                                    <textarea
                                        value={formData.regrade_feedback}
                                        onChange={(e) => setFormData({...formData, regrade_feedback: e.target.value})}
                                        placeholder="Explain your decision..."
                                        className="w-full p-3 text-sm rounded-xl border border-amber-200 focus:border-amber-500 outline-none transition-all resize-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Points Earned</label>
                            <div className="flex items-center gap-3">
                                <div className="w-full p-3 sm:p-4 rounded-xl border-2 border-slate-100 bg-slate-50 text-sm font-bold text-slate-700">
                                    {rawGrade}
                                </div>
                                <span className="text-base sm:text-lg font-bold text-slate-400">/ {pointsPossible}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">Computed automatically from question scores.</p>
                        </div>
                        <div className="space-y-4 grid grid-cols-2 sm:block gap-4">
                            <div>
                                <div className="text-xs sm:text-sm font-bold text-blue-600 mb-1 uppercase tracking-tighter">Raw Percentage</div>
                                <div className="text-lg sm:text-xl font-bold text-slate-500">
                                    {rawPercentage}%
                                </div>
                            </div>

                            {isLate && (
                                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="text-[10px] font-bold text-red-600 uppercase">Late ({daysLate} days)</div>
                                    <div className="text-base sm:text-lg font-black text-red-700">-{calculatedPenalty}%</div>
                                </div>
                            )}

                            <div>
                                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-1 uppercase tracking-tighter">Final Grade</div>
                                <div className="text-2xl sm:text-3xl font-black text-blue-600">
                                    {finalGrade}%
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Feedback</label>
                        <textarea
                            value={formData.feedback}
                            onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
                            className="w-full h-24 sm:h-32 p-3 sm:p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                            placeholder="Great job! Next time try to..."
                        />
                    </div>
            </div>
        </Modal>
    );
};
