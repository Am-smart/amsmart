import React, { useState } from 'react';
import { AssignmentDTO, User } from '@/lib/types';
import * as actions from '@/lib/api-actions';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';
import { FileUpload } from '@/components/ui-legacy/FileUpload';
import { Shield, Users, Crown, Lock } from 'lucide-react';

interface AssignmentFormProps {
  assignment: AssignmentDTO;
  user: User;
  onComplete: (submissionId: string) => void;
  onCancel: () => void;
}

type AnswerMode = 'essay' | 'file' | 'link';
type AnswerValue = { mode: AnswerMode; value: string };

const getAllowedModes = (q: { type?: string; types?: string[] }): AnswerMode[] => {
    const raw = (q.types && q.types.length > 0) ? q.types : (q.type ? [q.type] : ['essay']);
    return raw.filter((m): m is AnswerMode => m === 'essay' || m === 'file' || m === 'link');
};

// Validate that all answers conform to allowed modes for each question
const validateAnswerModes = (answers: Record<string, AnswerValue>, questions: any[]): string | null => {
    for (const question of questions) {
        const answer = answers[question.id];
        if (!answer) continue;
        
        const allowed = getAllowedModes(question);
        if (!allowed.includes(answer.mode)) {
            return `Invalid submission mode "${answer.mode}" for "${question.text}". Allowed: ${allowed.join(', ')}`;
        }
    }
    return null;
};

export const AssignmentForm: React.FC<AssignmentFormProps> = ({ assignment, user, onComplete, onCancel }) => {
  const { addToast } = useAppContext();
  const [submissionText, setSubmissionText] = useState('');
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [activeMode, setActiveMode] = useState<Record<string, AnswerMode>>(() => {
      const initial: Record<string, AnswerMode> = {};
      (assignment.questions || []).forEach((q) => {
          const modes = getAllowedModes(q);
          initial[q.id] = modes[0];
      });
      return initial;
  });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToQueue, isOnline } = useIndexedDB();

  const isGroupWork = assignment.assignment_type === 'group';
  const myGroup = isGroupWork
    ? (assignment.groups || []).find((g) => g.member_ids.includes(user.id))
    : undefined;
  const isLeader = !!myGroup && myGroup.leader_id === user.id;

  const { violationCount } = useAntiCheat(
    assignment.anti_cheat_enabled,
    assignment.title,
    assignment.course_id,
    assignment.id,
    assignment.metadata?.antiCheatConfig as any
  );
  const isLocked = assignment.anti_cheat_enabled && assignment.hard_enforcement && violationCount >= 5;

  // Anti-cheat: Feedback and detection
  React.useEffect(() => {
    if (isLocked) {
        addToast('Security Threshold Reached: Assignment has been locked due to multiple violations.', 'error', 10000);
    }

    const handleViolation = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (assignment.anti_cheat_enabled && detail) {
            addToast(`Anti-Cheat Alert: ${detail.type} detected!`, 'error');
        }
    };
    window.addEventListener('anti-cheat-violation', handleViolation);
    return () => window.removeEventListener('anti-cheat-violation', handleViolation);
  }, [violationCount, assignment.anti_cheat_enabled, addToast, isLocked]);

  const performUpload = async (file: File, category: 'materials' | 'submissions' | 'thumbnails') => {
    if (!isOnline) {
      throw new Error('File upload requires an active internet connection.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const res = await fetch('/api/v1/system/upload', {
        method: 'POST',
        headers: {
            'x-session-id': user.sessionId || '',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
    }

    const result = await res.json();
    const publicUrl = result.data?.publicUrl || result.publicUrl;
    return { url: publicUrl };
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
        // Validate answer modes before submission
        if (assignment.questions && assignment.questions.length > 0) {
            const modeValidationError = validateAnswerModes(answers, assignment.questions);
            if (modeValidationError) {
                addToast(modeValidationError, 'error');
                setIsSubmitting(false);
                return;
            }
        }

        const payload = {
            assignment_id: assignment.id,
            student_id: user.id,
            submission_text: submissionText,
            answers,
            file_url: fileUrl || undefined,
            status: 'submitted' as const,
            submitted_at: new Date().toISOString()
        };

        if (isOnline) {
            const res = await actions.submitAssignment(assignment.id, payload);
            if (res.success) {
                addToast('Assignment submitted successfully!', 'success');
                onComplete(res.data?.id || Math.random().toString());
            } else {
                throw new Error(res.error);
            }
        } else {
            await addToQueue('SUBMISSION', payload);
            addToast('Offline: Submission queued for synchronization.', 'info');
            onComplete('temp-id');
        }
    } catch (err: unknown) {
        console.error('Failed to submit assignment:', err);
        const msg = err instanceof Error ? err.message : 'Failed to submit assignment. Please try again.';
        addToast(msg, 'error');
        setIsSubmitting(false);
    }
  };

  if (isGroupWork && !myGroup) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in duration-300">
          <Lock size={56} className="text-slate-400 mx-auto mb-6" />
          <h2 className="text-xl font-black text-slate-900 mb-2 uppercase">Group Members Only</h2>
          <p className="text-sm text-slate-500 mb-8 font-medium">
            This is group work and you have not been placed in a group yet. Please contact your instructor.
          </p>
          <button onClick={onCancel} className="btn-primary w-full py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh] md:max-h-[90vh] relative">

        {isLocked && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-6 text-center">
                <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
                    <Shield size={64} className="text-red-600 mx-auto mb-6" />
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2 uppercase">Assignment Locked</h2>
                    <p className="text-sm md:text-base text-slate-500 mb-8 font-medium">This assignment has been locked due to security violations. Please contact your instructor.</p>
                    <button
                        onClick={onCancel}
                        className="btn-primary w-full py-3 md:py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        )}
        <header className="p-4 md:p-8 border-b bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">{assignment.title}</h2>
            <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase">{assignment.course?.title || 'Assignment'}</span>
                <span className="text-[10px] text-slate-500 font-medium">Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
        </header>

        <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1">
          {myGroup && (
            <div className="bg-indigo-50 p-4 md:p-5 rounded-2xl border border-indigo-100 flex items-start gap-3">
              <Users size={18} className="text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
                  Group submission — {myGroup.name}
                </h4>
                <p className="text-sm text-indigo-900 mt-1">
                  {myGroup.member_ids.length} member{myGroup.member_ids.length === 1 ? '' : 's'} share one submission and
                  one grade.
                  {myGroup.leader_id
                    ? isLeader
                      ? ' You are the group leader, so regrade requests are yours to send.'
                      : ' Only your group leader can send a regrade request.'
                    : ''}
                </p>
                {isLeader && (
                  <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    <Crown size={11} /> Group leader
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="bg-blue-50 p-4 md:p-6 rounded-2xl border border-blue-100">
            <h4 className="text-xs font-bold text-blue-700 uppercase mb-2">Instructions</h4>
            <div className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{assignment.description}</div>
          </div>


          {assignment.questions && assignment.questions.length > 0 ? (
            <div className="space-y-8">
              {assignment.questions.map((q, idx) => (
                <div key={idx} className="space-y-4 p-4 md:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-slate-800">Step {idx + 1}: {q.text}</h4>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase shrink-0">{q.points} Points</span>
                  </div>
                  {(() => {
                      const modes = getAllowedModes(q);
                      const mode = activeMode[q.id] || modes[0];
                      const current = answers[q.id];
                      const value = current && current.mode === mode ? current.value : '';
                      const setValue = (v: string) => setAnswers((prev) => ({ ...prev, [q.id]: { mode, value: v } }));
                      return (
                          <>
                              {modes.length > 1 && (
                                  <div className="flex flex-wrap gap-2">
                                      {modes.map((m) => (
                                          <button
                                              key={m}
                                              type="button"
                                              onClick={() => setActiveMode((prev) => ({ ...prev, [q.id]: m }))}
                                              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 transition-all ${mode === m ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                          >
                                              {m === 'essay' ? 'Written' : m === 'file' ? 'File Upload' : 'Link'}
                                          </button>
                                      ))}
                                  </div>
                              )}

                              {mode === 'essay' && (
                                  <textarea
                                      placeholder="Type your response here..."
                                      className="w-full h-24 md:h-32 p-3 md:p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all resize-none text-sm"
                                      value={value}
                                      onChange={(e) => setValue(e.target.value)}
                                  />
                              )}

                              {mode === 'file' && (
                                  <FileUpload
                                      category="submissions"
                                      uploadFn={performUpload}
                                      onUploadComplete={(url) => setValue(url)}
                                      label="Upload Evidence"
                                      acceptedTypes={q.extensions ? q.extensions.split(',').map((e) => e.trim()) : undefined}
                                  />
                              )}

                              {mode === 'link' && (
                                  <input
                                      type="url"
                                      placeholder="https://example.com"
                                      className="w-full p-3 md:p-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 outline-none transition-all text-sm"
                                      value={value}
                                      onChange={(e) => setValue(e.target.value)}
                                  />
                              )}
                          </>
                      );
                  })()}
                </div>
              ))}

              <div className="pt-4 border-t">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Final Comments / Full Submission</label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Provide any final details for your submission..."
                    className="w-full h-24 md:h-40 p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none text-sm text-slate-700"
                  />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Write your submission</label>
                <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-24 md:h-40 p-4 rounded-xl md:rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all resize-none text-sm text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-3 tracking-wide">Upload evidence / files</label>
                <FileUpload
                  category="submissions"
                  uploadFn={performUpload}
                  onUploadComplete={(url) => setFileUrl(url)}
                  label="Drag and drop your submission files here"
                />
              </div>
            </>
          )}
        </div>

        <footer className="p-4 md:p-8 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-3 md:gap-4 shrink-0">
            <button onClick={onCancel} className="btn-secondary w-full sm:w-auto px-6 md:px-8 py-3 text-sm order-2 sm:order-1">Cancel</button>
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!submissionText && !fileUrl && (assignment.questions ? assignment.questions.length === 0 : true) && Object.keys(answers).length === 0)}
                className="btn-primary w-full sm:w-auto px-8 md:px-10 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                title={isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
        </footer>
      </div>
    </div>
  );
};
