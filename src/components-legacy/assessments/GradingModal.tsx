import React, { useState, useMemo } from 'react';
import { SubmissionDTO, QuestionDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { gradeSubmission } from '@/lib/api-actions';
import { Modal } from '@/components/ui/Modal';

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

    const [formData, setFormData] = useState({
        feedback: submission.feedback || '',
        regrade_feedback: '',
        response_feedback: submission.response_feedback || {},
        question_scores: submission.question_scores || {}
    });
    const [isSaving, setIsSaving] = useState(false);
    const [regradeStatus, setRegradeStatus] = useState<'pending' | 'resolved'>(submission.regrade_request ? 'pending' : 'resolved');

    const pointsPossible = submission.assignment?.points_possible || 100;

    const { rawGrade, rawPercentage, finalGrade } = useMemo(() => {
        const raw = Object.values(formData.question_scores).reduce((a: number, b) => a + (b as number), 0);
        const rawPerc = Math.round((raw / pointsPossible) * 100);
        const final = Math.max(0, rawPerc - calculatedPenalty);
        return { rawGrade: raw, rawPercentage: rawPerc, finalGrade: final };
    }, [formData.question_scores, pointsPossible, calculatedPenalty]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const gradeData: Partial<SubmissionDTO> = {
                grade: rawGrade,
                feedback: formData.feedback,
                response_feedback: formData.response_feedback,
                question_scores: formData.question_scores
            };

            if (submission.regrade_request && regradeStatus === 'resolved') {
                if (!formData.regrade_feedback.trim()) {
                    addToast('Please provide a regrade response explanation.', 'error');
                    setIsSaving(false);
                    return;
                }
                gradeData.regrade_request = null;
                gradeData.feedback = `${formData.feedback}\n\n[Regrade Response]: ${formData.regrade_feedback}`;
            }

            await gradeSubmission(submission.id, gradeData);

            addToast('Grade saved successfully!', 'success');
            onSave();
        } catch (err) {
            console.error('Grading failed:', err);
            addToast('Failed to save grade.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            title="Grade Submission"
            onClose={onCancel}
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 w-full">
                    <button type="button" onClick={onCancel} className="btn-secondary w-full sm:flex-1 py-3 sm:py-4 text-sm">Discard</button>
                    <button type="submit" disabled={isSaving} className="btn-primary w-full sm:flex-1 py-3 sm:py-4 text-sm">
                        {isSaving ? 'Saving Grade...' : 'Save Grade & Return'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-blue-50 p-3 sm:p-4 md:p-6 rounded-2xl border border-blue-100 space-y-4">
                        <h4 className="text-xs sm:text-sm font-bold text-blue-700 uppercase mb-2">Student Submission</h4>

                        {(submission).answers && Object.keys((submission).answers as Record<string, unknown>).length > 0 ? (
                            <div className="space-y-4">
                                {submission.assignment?.questions.map((q: QuestionDTO, idx: number) => (
                                    <div key={q.id || idx} className="bg-white p-3 sm:p-5 rounded-2xl shadow-sm border border-blue-100/50 space-y-4">
                                        <div>
                                            <div className="text-[8px] sm:text-[10px] md:text-sm font-black text-blue-500 uppercase tracking-widest mb-2">Step {idx + 1}: {(q).text}</div>
                                            <div className="text-xs sm:text-sm text-slate-800">
                                                {(q).type === 'file' ? (
                                                    <a href={(submission).answers?.[q.id] as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">View Uploaded File</a>
                                                ) : (
                                                    ((submission).answers?.[q.id] as string) || <span className="italic text-slate-400">No response</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-blue-100/50 flex flex-col sm:flex-row gap-4">
                                            <div className="flex-1">
                                                <label className="text-[8px] sm:text-[10px] md:text-sm font-bold text-blue-400 uppercase tracking-widest block mb-1">Response Feedback</label>
                                                <input
                                                    type="text"
                                                    value={formData.response_feedback[q.id] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        response_feedback: { ...formData.response_feedback, [q.id]: e.target.value }
                                                    })}
                                                    placeholder="Provide feedback on this specific response..."
                                                    className="w-full bg-white/80 border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-400 outline-none"
                                                />
                                            </div>
                                            <div className="w-full sm:w-24">
                                                <label className="text-[8px] sm:text-[10px] md:text-sm font-bold text-blue-400 uppercase tracking-widest block mb-1">Score</label>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={formData.question_scores[q.id] ?? ''}
                                                        onChange={(e) => {
                                                            let val = e.target.value === '' ? 0 : Number(e.target.value);
                                                            // Validation: 0 to q.points
                                                            if (val < 0) val = 0;
                                                            if (val > (q.points || 0)) val = q.points || 0;

                                                            const newScores = { ...formData.question_scores, [q.id]: val };
                                                            setFormData({
                                                                ...formData,
                                                                question_scores: newScores
                                                            });
                                                        }}
                                                        className="w-full bg-white/80 border-none rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-400 outline-none font-bold"
                                                        placeholder="0"
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400">/ {q.points}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
