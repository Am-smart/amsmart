import React, { useState } from 'react';
import { QuizDTO, QuestionDTO } from '@/lib/types';
import { CourseDTO } from '@/lib/types';
import { useAppContext } from '@/components/AppContext';
import { Plus, Settings } from 'lucide-react';
import { saveQuiz } from '@/lib/api-actions';
import { ASSESSMENT_STATUS, ANTI_CHEAT_VIOLATIONS } from '@/lib/constants';
import { Modal } from '@/components/ui/Modal';
import { AntiCheatConfigModal } from './AntiCheatConfigModal';

interface QuizEditorProps {
    teacherId: string;
    quiz?: QuizDTO;
    courses: CourseDTO[];
    onSave: () => void;
    onCancel: () => void;
}

export const QuizEditor: React.FC<QuizEditorProps> = ({ teacherId, quiz, courses, onSave, onCancel }) => {
    const { addToast } = useAppContext();
    const [formData, setFormData] = useState<QuizDTO>({
        id: quiz?.id || '',
        teacher_id: teacherId,
        title: quiz?.title || '',
        description: quiz?.description || '',
        course_id: quiz?.course_id || (courses.length > 0 ? courses[0].id : ''),
        time_limit: quiz?.time_limit || 30,
        attempts_allowed: quiz?.attempts_allowed || 1,
        passing_score: quiz?.passing_score || 60,
        start_at: quiz?.start_at ? new Date(quiz.start_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        end_at: quiz?.end_at ? new Date(quiz.end_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        status: quiz?.status || ASSESSMENT_STATUS.DRAFT,
        anti_cheat_enabled: quiz?.anti_cheat_enabled || false,
        hard_enforcement: quiz?.hard_enforcement || false,
        shuffle_questions: quiz?.shuffle_questions || false,
        questions: (quiz?.questions) || [],
        metadata: quiz?.metadata || {}
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showAntiCheatModal, setShowAntiCheatModal] = useState(false);
    const [metadataText, setMetadataText] = useState(JSON.stringify(quiz?.metadata || {}, null, 2));

    const handleAddQuestion = () => {
        const newQ: QuestionDTO = {
            id: crypto.randomUUID(),
            text: '',
            type: 'mcq',
            points: 10,
            options: ['', '', '', ''],
            correct_answer: '',
            hint: '',
            explanation: ''
        };
        setFormData({ ...formData, questions: [...formData.questions, newQ] });
    };

    const handleQuestionChange = (index: number, updates: Partial<QuestionDTO>) => {
        const updated = [...formData.questions];
        updated[index] = { ...updated[index], ...updates };
        setFormData({ ...formData, questions: updated });
    };

    const handleRemoveQuestion = (index: number) => {
        const updated = [...formData.questions];
        updated.splice(index, 1);
        setFormData({ ...formData, questions: updated });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate metadata
        let parsedMetadata = {};
        try {
            parsedMetadata = JSON.parse(metadataText);
        } catch {
            addToast('Invalid JSON in metadata field', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                teacher_id: teacherId,
                id: quiz?.id || '',
                metadata: parsedMetadata
            };
            const result = await saveQuiz(payload);
            if (!result.success) {
                throw new Error(result.error || 'Failed to save quiz');
            }
            addToast('Quiz saved successfully!', 'success');
            onSave();
        } catch (err: unknown) {
            console.error('Save failed:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save quiz.';
            addToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            title={quiz?.id ? 'Edit Quiz' : 'Create New Quiz'}
            onClose={onCancel}
            maxWidth="max-w-4xl"
            asForm
            onSubmit={handleSubmit}
            footer={
                <div className="flex flex-col sm:flex-row justify-between gap-3 md:gap-4 w-full">
                    <button type="button" onClick={onCancel} className="btn-secondary flex-1 py-3 md:py-4 text-sm">Discard</button>
                    <button type="submit" disabled={isSaving || formData.questions.length === 0} className="btn-primary flex-1 py-3 md:py-4 text-sm">{isSaving ? 'Saving...' : 'Save Quiz'}</button>
                </div>
            }
        >
            <div className="space-y-4 md:space-y-6">
                    <div className="bg-slate-50 p-5 md:p-6 rounded-2xl md:rounded-3xl border-2 border-slate-100 space-y-4 md:space-y-6">
                        <h3 className="text-base md:text-lg font-bold text-slate-900 border-b pb-3 md:pb-4 mb-2 md:mb-4">Quiz Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Quiz Title</label>
                                <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Course</label>
                                <select value={formData.course_id} onChange={e => setFormData({...formData, course_id: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm">
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Description</label>
                            <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm h-24 resize-none" placeholder="Describe the quiz expectations..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Start At</label>
                                <input type="datetime-local" required value={formData.start_at} onChange={e => setFormData({...formData, start_at: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">End At</label>
                                <input type="datetime-local" required value={formData.end_at} onChange={e => setFormData({...formData, end_at: e.target.value})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Time Limit (mins)</label>
                                <input type="number" required value={formData.time_limit} onChange={e => setFormData({...formData, time_limit: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Attempts</label>
                                <input type="number" required value={formData.attempts_allowed} onChange={e => setFormData({...formData, attempts_allowed: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Passing Score (%)</label>
                                <input type="number" required value={formData.passing_score} onChange={e => setFormData({...formData, passing_score: Number(e.target.value)})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 uppercase mb-3 tracking-wide">Status</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as QuizDTO['status']})} className="w-full p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all shadow-sm">
                                    <option value={ASSESSMENT_STATUS.DRAFT}>Draft</option>
                                    <option value={ASSESSMENT_STATUS.PUBLISHED}>Published</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-xl border-2 border-slate-100">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        id="anti_cheat"
                                        checked={formData.anti_cheat_enabled}
                                        onChange={e => setFormData({...formData, anti_cheat_enabled: e.target.checked})}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <label htmlFor="anti_cheat" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Anti-Cheat</label>
                                        <p className="text-[10px] text-slate-500 font-medium">Monitor actions</p>
                                    </div>
                                </div>
                                {formData.anti_cheat_enabled && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAntiCheatModal(true)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                        title="Configure Violations"
                                    >
                                        <Settings size={18} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border-2 border-red-100">
                                <input
                                    type="checkbox"
                                    id="hard_enforcement"
                                    checked={formData.hard_enforcement}
                                    onChange={e => setFormData({...formData, hard_enforcement: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <div>
                                    <label htmlFor="hard_enforcement" className="block text-sm font-bold text-red-700 uppercase tracking-wide">Hard Enforcement</label>
                                    <p className="text-[10px] text-red-500 font-medium">Auto-submit on timeout/violation</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                                <input
                                    type="checkbox"
                                    id="shuffle_questions"
                                    checked={formData.shuffle_questions}
                                    onChange={e => setFormData({...formData, shuffle_questions: e.target.checked})}
                                    className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                <div>
                                    <label htmlFor="shuffle_questions" className="block text-sm font-bold text-purple-700 uppercase tracking-wide">Shuffle</label>
                                    <p className="text-[10px] text-purple-500 font-medium">Randomize order</p>
                                </div>
                            </div>
                        </div>

                        <AntiCheatConfigModal
                            isOpen={showAntiCheatModal}
                            onClose={() => setShowAntiCheatModal(false)}
                            config={(formData.metadata?.antiCheatConfig as any) || {}}
                            onChange={(newConfig) => {
                                setFormData({
                                    ...formData,
                                    metadata: {
                                        ...formData.metadata,
                                        antiCheatConfig: newConfig
                                    }
                                });
                                setMetadataText(JSON.stringify({
                                    ...formData.metadata,
                                    antiCheatConfig: newConfig
                                }, null, 2));
                            }}
                        />

                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
                                <Settings size={16} /> Advanced Metadata (JSON)
                            </label>
                            <textarea
                                value={metadataText}
                                onChange={e => setMetadataText(e.target.value)}
                                className="w-full h-32 p-4 rounded-xl border-2 border-white focus:border-blue-500 outline-none transition-all font-mono text-xs shadow-sm bg-slate-100"
                                placeholder='{"key": "value"}'
                            />
                        </div>
                    </div>

                    <div className="space-y-8 pt-8 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Questions</h3>
                        </div>
                        {formData.questions.map((q, index) => (
                            <div key={q.id} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="font-bold text-slate-400 uppercase tracking-widest text-xs">Question {index+1}</div>
                                    <button type="button" onClick={() => handleRemoveQuestion(index)} className="text-red-500 font-bold text-xs uppercase">Remove</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Question Type</label>
                                        <select
                                            value={q.type}
                                            onChange={e => {
                                                const newType = e.target.value as 'mcq' | 'tf' | 'short';
                                                const updates: Partial<QuestionDTO> = { type: newType, correct_answer: '' };
                                                if (newType === 'tf') {
                                                    updates.options = ['True', 'False'];
                                                } else if (newType === 'mcq') {
                                                    updates.options = ['', '', '', ''];
                                                } else {
                                                    updates.options = [];
                                                }
                                                handleQuestionChange(index, updates);
                                            }}
                                            className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white"
                                        >
                                            <option value="mcq">Multiple Choice</option>
                                            <option value="tf">True / False</option>
                                            <option value="short">Short Answer</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Points</label>
                                        <input type="number" value={q.points} onChange={e => handleQuestionChange(index, { points: Number(e.target.value) })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white" />
                                    </div>
                                </div>
                                <input type="text" required value={q.text} onChange={e => handleQuestionChange(index, { text: e.target.value })} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all bg-white" placeholder="Question text..." />

                                {q.type === 'mcq' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    {q.options?.map((opt, optIndex) => (
                                        <div key={optIndex} className="flex gap-2">
                                            <input type="text" value={opt} onChange={e => {
                                                const opts = [...(q.options || [])];
                                                opts[optIndex] = e.target.value;
                                                handleQuestionChange(index, { options: opts });
                                            }} className="flex-1 p-2.5 md:p-3 text-sm rounded-xl border border-slate-100 outline-none transition-all focus:border-blue-500 bg-white" placeholder={`Option ${optIndex+1}`} />
                                            <button type="button" onClick={() => handleQuestionChange(index, { correct_answer: opt })} className={`px-3 md:px-4 rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest ${q.correct_answer === opt ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Correct</button>
                                        </div>
                                    ))}
                                </div>
                                )}

                                {q.type === 'tf' && (
                                    <div className="flex gap-4">
                                        {['True', 'False'].map(opt => (
                                            <button key={opt} type="button" onClick={() => handleQuestionChange(index, { correct_answer: opt })} className={`flex-1 py-4 rounded-xl font-bold transition-all ${q.correct_answer === opt ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border-2 border-slate-100 text-slate-400'}`}>{opt}</button>
                                        ))}
                                    </div>
                                )}

                                {q.type === 'short' && (
                                    <input type="text" value={q.correct_answer} onChange={e => handleQuestionChange(index, { correct_answer: e.target.value })} className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white" placeholder="Correct answer for auto-grading..." />
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Hint (Optional)</label>
                                        <input type="text" value={q.hint || ''} onChange={e => handleQuestionChange(index, { hint: e.target.value })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white" placeholder="Small hint for students..." />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Explanation (Post-quiz)</label>
                                        <input type="text" value={q.explanation || ''} onChange={e => handleQuestionChange(index, { explanation: e.target.value })} className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none bg-white" placeholder="Explain the correct answer..." />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={handleAddQuestion} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all font-bold flex items-center justify-center gap-2">
                            <Plus size={18} /> Add Question
                        </button>
                    </div>
            </div>
        </Modal>
    );
};
