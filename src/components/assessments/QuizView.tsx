import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Shield, CheckCircle, X, Clock } from 'lucide-react';
import { QuizDTO, UserDTO, QuizQuestion } from '@/lib/types';
import * as actions from '@/lib/api-actions';
import { calculateQuizScore } from '@/lib/scoring-util';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { useAppContext } from '@/components/AppContext';
import { ANTI_CHEAT, ASSESSMENT } from '@/lib/constants';

interface QuizViewProps {
  quiz: QuizDTO;
  user: UserDTO;
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ quiz, user, onComplete, onCancel }) => {
  const { addToast } = useAppContext();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState(quiz.questions || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz.time_limit ? quiz.time_limit * 60 : null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; reason: 'manual' | 'timeout' | 'violation' } | null>(null);
  const { addToQueue, setCache, getCache, isOnline } = useIndexedDB();
  const [startedAt] = useState(new Date().toISOString());

  const { violationCount } = useAntiCheat(
    quiz.anti_cheat_enabled,
    quiz.title,
    quiz.course_id,
    quiz.id,
    quiz.metadata?.antiCheatConfig as any
  );

  useEffect(() => {
    const handleViolation = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (quiz.anti_cheat_enabled && detail) {
            // Check if toast already exists for this type in the last 2 seconds to avoid flooding
            addToast(`Anti-Cheat Alert: ${detail.type} detected!`, 'error');
        }
    };
    window.addEventListener('anti-cheat-violation', handleViolation);
    return () => window.removeEventListener('anti-cheat-violation', handleViolation);
  }, [quiz.anti_cheat_enabled, addToast]);

  // Note: Shuffling is handled server-side for students to prevent client-side manipulation.
  useEffect(() => {
    setQuestions(quiz.questions || []);
  }, [quiz.questions]);

  // Load saved progress from IndexedDB
  useEffect(() => {
    const loadProgress = async () => {
        const progress = await getCache<Record<string, string>>(`quiz_progress_${quiz.id}`);
        if (progress) setAnswers(progress);
    };
    loadProgress();
  }, [quiz.id, getCache]);

  // Save progress locally as user answers
  const handleAnswerChange = useCallback(async (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    await setCache(`quiz_progress_${quiz.id}`, newAnswers);
  }, [answers, quiz.id, setCache]);

  const handleSubmit = useCallback(async (reason: 'manual' | 'timeout' | 'violation' = 'manual') => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);

    try {
        const timeSpent = quiz.time_limit ? (quiz.time_limit * 60) - (timeLeft || 0) : 0;

        const payload = {
            answers,
            time_spent: timeSpent,
            started_at: startedAt
        };

        let score = 0;
        if (isOnline) {
            const res = await actions.submitQuiz(quiz.id, { ...payload, violation_count: violationCount });
            if (res.success && res.data) {
                score = res.data.score || 0;
            } else {
                throw new Error(res.error);
            }
        } else {
            // Offline estimation using unified logic
            const quizQuestions = (quiz.questions as unknown as QuizQuestion[]) || [];
            const result = calculateQuizScore(quizQuestions, answers);
            score = result.score;

            await addToQueue('QUIZ_SUBMISSION', {
                quiz_id: quiz.id,
                student_id: user.id,
                ...payload,
                score,
                violation_count: violationCount,
                status: 'submitted'
            });
        }

    const passed = score >= (quiz.passing_score || ASSESSMENT.DEFAULT_PASSING_SCORE);

        // Clean up progress cache
        await setCache(`quiz_progress_${quiz.id}`, null);
        setResult({ score, passed, reason });
        setIsSubmitting(false);
    } catch (err: unknown) {
        console.error('Failed to submit quiz:', err);
        const msg = err instanceof Error ? err.message : 'Failed to submit quiz. Please try again.';
        addToast(msg, 'error');
        setIsSubmitting(false);
    }
  }, [quiz, user, answers, isSubmitting, result, isOnline, addToQueue, setCache, timeLeft, startedAt, addToast, violationCount]);

  // Anti-cheat: Hard enforcement when enabled
  useEffect(() => {
    // Use hard_enforcement flag from database (Step 1)
    if (quiz.anti_cheat_enabled && quiz.hard_enforcement && violationCount >= ANTI_CHEAT.MAX_VIOLATIONS && !isSubmitting && !result) {
        addToast('Security Threshold Reached: Assessment locked and auto-submitted due to multiple violations.', 'error', 10000);
        handleSubmit('violation');
    }
  }, [violationCount, quiz, addToast, isSubmitting, result, handleSubmit]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
        handleSubmit('timeout');
        return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev! - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (result) {
    return (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-3xl p-6 md:p-10 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-center mb-6">
                    {result.reason === 'timeout' ? (
                        <Clock size={64} className="text-red-500" />
                    ) : result.reason === 'violation' ? (
                        <Shield size={64} className="text-red-600" />
                    ) : result.passed ? (
                        <CheckCircle size={64} className="text-green-500 animate-bounce" />
                    ) : (
                        <AlertTriangle size={64} className="text-amber-500" />
                    )}
                </div>

                {result.reason === 'timeout' && <div className="text-red-500 font-bold uppercase tracking-widest text-xs mb-2">Time&apos;s Up!</div>}
                {result.reason === 'violation' && <div className="text-red-600 font-bold uppercase tracking-widest text-xs mb-2">Security Violation Submission</div>}
                {result.reason === 'manual' && <div className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">Submission Complete</div>}

                <h2 className="text-3xl font-black mb-2">{result.passed ? 'PASSED!' : 'TRY AGAIN'}</h2>
                <p className="text-slate-500 font-medium mb-8">You scored {result.score}% in this attempt.</p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passing Score</div>
                    <div className="text-xl font-bold text-slate-700">{quiz.passing_score || ASSESSMENT.DEFAULT_PASSING_SCORE}%</div>
                </div>

                <button
                    onClick={() => onComplete(result.score)}
                    className="btn-primary w-full py-4 rounded-xl text-lg font-bold shadow-xl shadow-blue-500/20"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto" aria-busy={isSubmitting}>
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 pb-4 border-b gap-2 md:gap-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-center md:text-left">{quiz.title}</h1>
            <p className="text-slate-500 text-sm text-center md:text-left">{quiz.questions?.length || 0} Questions</p>
          </div>
          <div className="text-center md:text-right">
            {timeLeft !== null && (
              <div className={`text-xl md:text-2xl font-mono font-bold flex items-center justify-center md:justify-end gap-2 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                <Clock size={20} className="md:size-6" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase mt-2 inline-flex items-center gap-1">
              <X size={16} />
              Cancel Quiz
            </button>
          </div>
        </header>

        {quiz.anti_cheat_enabled && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs md:text-sm font-medium border ${violationCount > 0 ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                {violationCount > 0 ? (
                    <AlertTriangle size={20} className="shrink-0 text-red-600" />
                ) : (
                    <Shield size={20} className="shrink-0 text-amber-600" />
                )}
                {violationCount > 0
                    ? `SECURITY FLAG: ${violationCount} violation(s) detected. This attempt is marked for review.`
                    : 'Anti-cheat protection is active. Your actions are being monitored.'}
            </div>
        )}

        <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                <span className="text-xs font-bold text-blue-600">{Math.round((Object.keys(answers).length / (questions.length || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                    className="bg-blue-600 h-full transition-all duration-500"
                    style={{ width: `${(Object.keys(answers).length / (questions.length || 1)) * 100}%` }}
                ></div>
            </div>
        </div>

        <div className="min-h-[40vh]">
          {questions.length > 0 && (
            <div key={questions[currentQuestionIndex].id} className="quiz-question animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg md:text-xl font-bold mb-6 flex items-start gap-3">
                <span className="text-blue-600 shrink-0">{currentQuestionIndex + 1}.</span>
                {questions[currentQuestionIndex].text}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {questions[currentQuestionIndex].type === 'short' ? (
                  <input
                    type="text"
                    value={answers[questions[currentQuestionIndex].id] || ''}
                    onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 md:p-5 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm md:text-base"
                    autoFocus
                  />
                ) : (
                  (questions[currentQuestionIndex].options || []).map((opt: string) => (
                    <label key={opt} className={`flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 cursor-pointer transition-all ${answers[questions[currentQuestionIndex].id] === opt ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input
                        type="radio"
                        name={questions[currentQuestionIndex].id}
                        value={opt}
                        checked={answers[questions[currentQuestionIndex].id] === opt}
                        onChange={(e) => handleAnswerChange(questions[currentQuestionIndex].id, e.target.value)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="font-medium text-slate-700 text-sm md:text-base">{opt}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-3 w-full sm:w-auto">
                <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="btn-secondary flex-1 sm:flex-none px-6 py-3 disabled:opacity-30"
                >
                    Previous
                </button>
                {currentQuestionIndex < questions.length - 1 ? (
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        className="btn-primary flex-1 sm:flex-none px-8 py-3"
                    >
                        Next Question
                    </button>
                ) : (
                    <button
                        onClick={() => handleSubmit('manual')}
                        disabled={isSubmitting || !!result}
                        className="btn-primary flex-1 sm:flex-none px-8 py-3 bg-green-600 hover:bg-green-700 border-green-600"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                )}
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest order-first sm:order-last">
                Question {currentQuestionIndex + 1} of {questions.length}
            </p>
        </div>
      </div>
    </div>
  );
};
