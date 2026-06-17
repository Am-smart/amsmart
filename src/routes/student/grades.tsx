import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { EnrollmentDTO, SubmissionDTO, QuizSubmissionDTO } from '@/lib/types';
import { BookMarked, ChevronRight } from 'lucide-react';

function StudentGradesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionDTO[]>([]);
  const [allQuizSubmissions, setAllQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.id) {
        setIsLoading(true);
        Promise.all([
            getEnrollments(user.id),
            getSubmissions({ studentId: user.id }),
            getQuizSubmissions(undefined, user.id)
        ]).then(([enrols, subs, qSubs]) => {
            setEnrollments(enrols || []);
            setAllSubmissions(subs || []);
            setAllQuizSubmissions(qSubs || []);
            setIsLoading(false);
        });
    }
  }, [user]);

  const calculateGrade = (courseId: string) => {
      const courseSubmissions = allSubmissions.filter(s => s.assignment?.course_id === courseId && s.status === 'graded');
      const courseQuizSubmissions = allQuizSubmissions.filter(s => s.quiz?.course_id === courseId && s.status === 'submitted');

      const highestQuizScores = new Map<string, number>();
      courseQuizSubmissions.forEach(qs => {
          const current = highestQuizScores.get(qs.quiz_id) || 0;
          if (qs.score > current) highestQuizScores.set(qs.quiz_id, qs.score);
      });

      const asgnScores = courseSubmissions.map(s => s.final_grade || 0);
      const quizScores = Array.from(highestQuizScores.values());

      const allScores = [...asgnScores, ...quizScores];
      if (allScores.length === 0) return null;

      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      return Math.round(avg);
  };

  if (isLoading) {
      return <div className="p-8 animate-pulse space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded-xl"></div>
          <div className="grid gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl"></div>)}
          </div>
      </div>;
  }

  return (
    <div className="space-y-8">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <BookMarked size={24} />
            </div>
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Academic Grades</h1>
                <p className="text-slate-500 text-sm font-medium">Detailed breakdown of your performance across all courses.</p>
            </div>
        </div>

        {enrollments.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4">
                <div className="text-4xl">🎓</div>
                <h3 className="text-lg font-bold text-slate-900">No Grades Yet</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Enroll in courses and complete assessments to see your grades here.</p>
            </div>
        ) : (
            <div className="grid gap-6">
                {enrollments.map(e => {
                    const grade = calculateGrade(e.course_id);
                    const courseSubs = allSubmissions.filter(s => s.assignment?.course_id === e.course_id);
                    const quizSubs = allQuizSubmissions.filter(qs => qs.quiz?.course_id === e.course_id);

                    return (
                        <div key={e.course_id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 border-b border-slate-100">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900">{e.course?.title}</h3>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Grade</div>
                                        <div className={`text-3xl font-black ${grade === null ? 'text-slate-300' : grade >= 80 ? 'text-green-600' : grade >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {grade !== null ? `${grade}%` : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200"></div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Progress</div>
                                        <div className="text-xl font-black text-slate-900">{e.progress}%</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assignments</h4>
                                    {courseSubs.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No assignments submitted yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {courseSubs.map(s => (
                                                <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${s.status === 'graded' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                                        <span className="font-bold text-slate-700">{s.assignment?.title}</span>
                                                    </div>
                                                    <span className={`font-black ${s.status === 'graded' ? 'text-green-600' : 'text-amber-500'}`}>
                                                        {s.status === 'graded' ? `${s.final_grade}%` : s.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Quizzes (Highest Attempts)</h4>
                                    {quizSubs.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No quizzes taken yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {(() => {
                                                const highest = new Map<string, { title: string, score: number }>();
                                                quizSubs.forEach(qs => {
                                                    const current = highest.get(qs.quiz_id);
                                                    if (!current || qs.score > current.score) {
                                                        highest.set(qs.quiz_id, { title: qs.quiz?.title || 'Quiz', score: qs.score });
                                                    }
                                                });
                                                return Array.from(highest.values()).map((q, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                            <span className="font-bold text-slate-700">{q.title}</span>
                                                        </div>
                                                        <span className="font-black text-blue-600">{q.score}%</span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
}


export const Route = createFileRoute('/student/grades')({
  head: () => ({ meta: [{ title: "Student — Grades — SmartLMS" }] }),
  component: StudentGradesPage,
});
