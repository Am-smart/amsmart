import React from 'react';
import { QuizDTO, QuizSubmissionDTO } from '@/lib/types';
import { Countdown } from '@/components/ui/Countdown';
import { HelpCircle, Trophy, History, PlayCircle, Lock, Ban, Timer, GraduationCap } from 'lucide-react';

interface QuizzesListProps {
  quizzes: QuizDTO[];
  submissions: QuizSubmissionDTO[];
  onStart: (quizId: string) => void;
  onViewResults: (quizId: string, submissionId: string) => void;
}

export const QuizzesList: React.FC<QuizzesListProps> = ({ quizzes, submissions, onStart, onViewResults }) => {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="text-purple-600" size={24} />
            My Assessments
        </h2>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {quizzes.length} Quizzes
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-5">Quiz Details</th>
                <th className="px-6 py-5">Availability</th>
                <th className="px-6 py-5">Attempts</th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-2">
                        <HelpCircle size={40} className="text-slate-200" />
                        <span>No quizzes assigned to you at this time.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                quizzes.map(quiz => {
                  const mySubs = submissions
                    .filter(s => s.quiz_id === quiz.id && s.status === 'submitted')
                    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

                  const bestScore = mySubs.length ? Math.max(...mySubs.map(s => s.score)) : null;
                  const attemptsUsed = mySubs.length;
                  const canAttempt = attemptsUsed < quiz.attempts_allowed;

                  const startAt = quiz.start_at ? new Date(quiz.start_at) : null;
                  const endAt = quiz.end_at ? new Date(quiz.end_at) : null;
                  const isNotStarted = startAt && now < startAt;
                  const isEnded = endAt && now > endAt;

                  return (
                    <tr key={quiz.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                                <GraduationCap size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">{quiz.title}</div>
                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{quiz.course?.title || 'General'}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                            {isNotStarted ? (
                                <div className="flex flex-col gap-1">
                                    <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 font-black uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                                        <Timer size={10} /> Locked
                                    </span>
                                    <div className="text-[10px] font-bold text-slate-400">Starts in:</div>
                                    <Countdown targetDate={startAt!} compact className="text-xs" endLabel={null} />
                                </div>
                            ) : isEnded ? (
                                <span className="inline-flex items-center gap-1 text-[9px] text-slate-500 font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                                    <Ban size={10} /> Closed
                                </span>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    <span className="inline-flex items-center gap-1 text-[9px] text-green-600 font-black uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                        <PlayCircle size={10} /> Active
                                    </span>
                                    {endAt && (
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Ends in:</div>
                                            <Countdown targetDate={endAt} compact className="text-xs text-slate-700" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1.5">
                            <div className="text-sm font-bold text-slate-700">
                                {attemptsUsed} <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">of</span> {quiz.attempts_allowed}
                            </div>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all duration-500"
                                    style={{ width: `${(attemptsUsed / quiz.attempts_allowed) * 100}%` }}
                                />
                            </div>
                            {mySubs.length > 0 && (
                                <div className="flex gap-1 overflow-hidden">
                                    {mySubs.slice(0, 3).map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => onViewResults(quiz.id, sub.id)}
                                            className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 transition-colors"
                                            title="View results"
                                        >
                                            #{attemptsUsed - mySubs.indexOf(sub)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {bestScore !== null ? (
                            <div className="flex items-center gap-3">
                                <div className={`text-xl font-black ${bestScore >= 80 ? 'text-green-600' : 'text-slate-900'}`}>{bestScore}%</div>
                                <Trophy size={20} className={bestScore >= 80 ? 'text-amber-400' : 'text-slate-200'} />
                            </div>
                        ) : (
                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">No Data</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end gap-2">
                            {!canAttempt ? (
                                <div className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">
                                    <Lock size={14} /> Completed
                                </div>
                            ) : isNotStarted ? (
                                <div className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed border border-amber-100">
                                    <Timer size={14} /> Coming Soon
                                </div>
                            ) : isEnded ? (
                                <div className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-slate-50 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-100">
                                    <Ban size={14} /> Overdue
                                </div>
                            ) : (
                                <button
                                    onClick={() => onStart(quiz.id)}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <PlayCircle size={18} />
                                    {attemptsUsed > 0 ? 'Retake Quiz' : 'Start Assessment'}
                                </button>
                            )}
                            {mySubs.length > 0 && (
                                <button
                                    onClick={() => onViewResults(quiz.id, mySubs[0].id)}
                                    className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-800 transition-colors"
                                >
                                    <History size={12} /> View Latest Results
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
