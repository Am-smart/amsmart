import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { dynamic } from '@/lib/next-compat';
import { useAuth } from '@/components/auth/AuthContext';
import * as actions from '@/lib/api-actions';
import { QuizDTO } from '@/lib/types';
import { CourseDTO } from '@/lib/types';
import { Trash2, Edit } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';

const QuizEditor = dynamic(() => import("@/components/assessments/QuizEditor").then(mod => mod.QuizEditor), {
    loading: () => <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Editor...</div>
});

function QuizzesPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<QuizDTO | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async () => {
      if (!user) return;
      try {
          const myCourses = await actions.getCourses(user.id);
          setCourses(myCourses);
          const myQuizzes = await actions.getQuizzes(undefined, user.id);
          setQuizzes(myQuizzes);
      } catch (err) {
          console.error('Failed to fetch quizzes:', err);
      }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this quiz?')) return;
      try {
          await actions.deleteQuiz(id);
          addToast('Quiz deleted successfully', 'success');
          fetchData();
      } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to delete quiz';
          addToast(msg, 'error');
      }
  };

  return (
    <div className="space-y-6">
        {(isAdding || editingQuiz) && (
          <div className="fixed inset-0 z-[60] overflow-y-auto">
            <QuizEditor
                teacherId={user!.id}
                quiz={editingQuiz || undefined}
                courses={courses}
                onSave={() => { setEditingQuiz(null); setIsAdding(false); fetchData(); }}
                onCancel={() => { setEditingQuiz(null); setIsAdding(false); }}
            />
          </div>
        )}
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Quizzes</h2>
            <button onClick={() => setIsAdding(true)} className="btn-primary">Create Quiz</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.length === 0 ? (
                <div className="col-span-full py-12 bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-500 italic">
                    No quizzes created yet.
                </div>
            ) : (
                quizzes.map(q => (
                    <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg mb-2 text-slate-900 line-clamp-1">{q.title}</h3>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{q.description}</p>
                        <div className="flex justify-between items-center pt-4 border-t">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${q.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
                                {q.status}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingQuiz(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
  );
}


export const Route = createFileRoute('/teacher/quizzes')({
  head: () => ({ meta: [{ title: "Teacher — Quizzes — SmartLMS" }] }),
  component: QuizzesPage,
});
