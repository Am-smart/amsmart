import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AppContext';
import { getCourses, getEnrollments, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { EnrollmentDTO, CourseDTO } from '@/lib/types';
import { SubmissionDTO, QuizSubmissionDTO } from '@/lib/types';
import { exportToCSV, exportToPDF } from '@/lib/report-utils';
import { FileSpreadsheet, FileText, ExternalLink, X, BookOpen, GraduationCap, BarChart3, Search } from 'lucide-react';

function GradeBookPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<SubmissionDTO[]>([]);
  const [allQuizSubmissions, setAllQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDetails, setSelectedDetails] = useState<{ student: string, course: string, studentId: string, courseId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
        const myCourses = await getCourses(user.id);
        setCourses(myCourses);
        const courseIds = myCourses.map(c => c.id);

        if (courseIds.length > 0) {
            const [enrols, subs, qSubs] = await Promise.all([
                getEnrollments(undefined, courseIds),
                getSubmissions(), // Service layer automatically filters by teacher's ownership
                getQuizSubmissions() // Service layer automatically filters by teacher's ownership
            ]);
            setEnrollments(enrols || []);
            setAllSubmissions(subs || []);
            setAllQuizSubmissions(qSubs || []);
        }
    } catch (error) {
        console.error("Failed to fetch gradebook data:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateGrade = useCallback((studentId: string, courseId: string) => {
      // Verify course exists
      const courseExists = courses.some(c => c.id === courseId);
      if (!courseExists) return null;

      const courseSubmissions = allSubmissions.filter(s =>
          s.student_id === studentId &&
          s.assignment?.course_id === courseId &&
          s.status === 'graded' &&
          s.final_grade !== undefined &&
          s.final_grade !== null
      );

      const courseQuizSubmissions = allQuizSubmissions.filter(s =>
          s.student_id === studentId &&
          s.quiz?.course_id === courseId &&
          s.status === 'submitted'
      );

      // Group quiz submissions by quiz_id and take the highest score for each
      const highestQuizScores = new Map<string, number>();
      courseQuizSubmissions.forEach(qs => {
          const current = highestQuizScores.get(qs.quiz_id) || 0;
          if (qs.score > current) highestQuizScores.set(qs.quiz_id, qs.score);
      });

      const asgnScores = courseSubmissions.map(s => s.final_grade as number);
      const quizScores = Array.from(highestQuizScores.values());

      const allScores = [...asgnScores, ...quizScores];
      if (allScores.length === 0) return null;

      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      return Math.round(avg);
  }, [courses, allSubmissions, allQuizSubmissions]);

  const filteredEnrollments = enrollments.filter(e =>
    e.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    const data = filteredEnrollments.map(e => ({
        Student: e.student?.full_name || 'Anonymous',
        Email: e.student?.email || 'N/A',
        Course: e.course?.title || 'N/A',
        Progress: `${e.progress}%`,
        Grade: calculateGrade(e.student_id, e.course_id)?.toString() || 'N/A'
    }));
    exportToCSV(data, 'Gradebook_Report');
  };

  const handleExportPDF = () => {
    const headers = ['Student', 'Course', 'Progress', 'Grade'];
    const rows = filteredEnrollments.map(e => [
        e.student?.full_name || 'Anonymous',
        e.course?.title || 'N/A',
        `${e.progress}%`,
        calculateGrade(e.student_id, e.course_id)?.toString() || 'N/A'
    ]);
    exportToPDF('Teacher Grade Book Report', headers, rows, 'Gradebook_Report');
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/30 backdrop-blur-sm">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BookOpen className="text-blue-600" size={32} />
                        Academic Grade Book
                    </h2>
                    <p className="text-slate-500 text-sm font-bold mt-1 uppercase tracking-widest">Real-time performance tracking and reporting</p>
                    <div className="flex gap-4 mt-6">
                        <button onClick={handleExportCSV} className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-green-600 hover:border-green-100 transition-all shadow-sm">
                            <FileSpreadsheet size={16} className="group-hover:scale-110 transition-transform" /> Export CSV
                        </button>
                        <button onClick={handleExportPDF} className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 hover:border-red-100 transition-all shadow-sm">
                            <FileText size={16} className="group-hover:scale-110 transition-transform" /> Export PDF
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                    <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-100 flex flex-col items-center min-w-[140px]">
                        <span className="text-2xl font-black">{enrollments.length}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Enrolled Students</span>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-6">Academic Identity</th>
                            <th className="px-8 py-6">Course Enrollment</th>
                            <th className="px-8 py-6">Curriculum Progress</th>
                            <th className="px-8 py-6 text-center">GPA / Avg Grade</th>
                            <th className="px-8 py-6 text-right">Records</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            [1,2,3,4,5].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-8 py-8">
                                        <div className="h-12 bg-slate-50 rounded-2xl w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : filteredEnrollments.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-bold">
                                    <div className="flex flex-col items-center gap-3">
                                        <Search size={40} className="text-slate-200" />
                                        <p>No student records matching your search criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEnrollments.map(e => {
                                const grade = calculateGrade(e.student_id, e.course_id);
                                return (
                                    <tr key={`${e.course_id}-${e.student_id}`} className="hover:bg-slate-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-300">
                                                    <GraduationCap size={24} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">{e.student?.full_name || 'Anonymous Student'}</div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tight italic">{e.student?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-slate-700">{e.course?.title}</div>
                                            <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest italic">ID: {e.course_id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2 min-w-[140px]">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <BarChart3 size={10} /> Progress
                                                    </span>
                                                    <span className="text-xs font-black text-slate-900">{e.progress}%</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <div className={`h-full transition-all duration-1000 ${e.progress >= 80 ? 'bg-green-500' : e.progress >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${e.progress}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {grade !== null ? (
                                                <div className={`inline-flex flex-col items-center justify-center w-16 h-16 rounded-[1.25rem] font-black text-lg shadow-sm border-2 ${
                                                    grade >= 80 ? 'bg-green-50 border-green-100 text-green-700' :
                                                    grade >= 60 ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                    'bg-red-50 border-red-100 text-red-700'
                                                }`}>
                                                    {grade}%
                                                    <span className="text-[8px] uppercase tracking-tighter opacity-70">Average</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 italic uppercase tracking-widest border border-slate-100 px-3 py-1.5 rounded-full">No Data</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedDetails({ student: e.student?.full_name || 'Student', course: e.course?.title || 'Course', studentId: e.student_id, courseId: e.course_id })}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm shadow-blue-50"
                                            >
                                                <ExternalLink size={14} /> View Files
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {selectedDetails && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
                    <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                                <GraduationCap size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedDetails.student}</h3>
                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1 italic">{selectedDetails.course}</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedDetails(null)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors text-slate-400 hover:text-slate-600 bg-slate-100">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 md:p-10 max-h-[60vh] overflow-y-auto space-y-10 scrollbar-thin scrollbar-thumb-slate-200">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment Records</h4>
                                <div className="h-px flex-1 bg-slate-100 mx-4" />
                            </div>
                            <div className="space-y-4">
                                {allSubmissions.filter(s => s.student_id === selectedDetails.studentId && s.assignment?.course_id === selectedDetails.courseId).length === 0 ? (
                                    <p className="text-sm text-slate-400 italic font-bold text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No assignment submissions logged.</p>
                                ) : (
                                    allSubmissions.filter(s => s.student_id === selectedDetails.studentId && s.assignment?.course_id === selectedDetails.courseId).map(s => (
                                        <div key={s.id} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 group hover:border-blue-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileText size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                                <div>
                                                    <span className="font-black text-slate-700 text-sm">{s.assignment?.title}</span>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Submitted: {new Date(s.submitted_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {s.status === 'graded' ? `${s.final_grade}%` : s.status.toUpperCase()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quiz History (Best Score)</h4>
                                <div className="h-px flex-1 bg-slate-100 mx-4" />
                            </div>
                            <div className="space-y-4">
                                {(() => {
                                    const quizSubs = allQuizSubmissions.filter(s => s.student_id === selectedDetails.studentId && s.quiz?.course_id === selectedDetails.courseId);
                                    if (quizSubs.length === 0) return <p className="text-sm text-slate-400 italic font-bold text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No quiz attempts recorded.</p>;

                                    const highest = new Map<string, { title: string, score: number, date: string }>();
                                    quizSubs.forEach(qs => {
                                        const current = highest.get(qs.quiz_id);
                                        if (!current || qs.score > current.score) {
                                            highest.set(qs.quiz_id, { title: qs.quiz?.title || 'Quiz', score: qs.score, date: qs.submitted_at });
                                        }
                                    });

                                    return Array.from(highest.values()).map((q, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 group hover:border-purple-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <BarChart3 size={18} className="text-slate-400 group-hover:text-purple-500 transition-colors" />
                                                <div>
                                                    <span className="font-black text-slate-700 text-sm">{q.title}</span>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Best attempt on {new Date(q.date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-xl text-xs font-black shadow-sm">
                                                {q.score}%
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 md:p-10 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Cumulative Performance</span>
                            <span className="text-xs font-bold text-white opacity-60 italic">Based on all graded assessments</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-blue-400 tracking-tighter">{calculateGrade(selectedDetails.studentId, selectedDetails.courseId)}</span>
                            <span className="text-xl font-black text-blue-400">%</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}


export const Route = createFileRoute('/teacher/gradebook')({
  head: () => ({ meta: [{ title: "Teacher — Gradebook — SmartLMS" }] }),
  component: GradeBookPage,
});
