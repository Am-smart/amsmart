import React, { useMemo } from 'react';
import { FileText, FileSpreadsheet, Users, Crown } from 'lucide-react';
import { exportToPDF, exportToCSV } from '@/lib/report-utils';
import type { CourseDTO, EnrollmentDTO, SubmissionDTO, QuizSubmissionDTO } from '@/lib/types';

interface TeacherAnalyticsProps {
  courses: CourseDTO[];
  enrollments: EnrollmentDTO[];
  submissions: SubmissionDTO[];
  quizSubmissions: QuizSubmissionDTO[];
}

/**
 * Teaching performance analytics. Pure presentation: all data is fetched by
 * the route and passed in, mirroring `StudentAnalytics`.
 */
export const TeacherAnalytics: React.FC<TeacherAnalyticsProps> = ({
  courses,
  enrollments,
  submissions,
  quizSubmissions,
}) => {
  const stats = useMemo(() => {
    const graded = submissions.filter((s) => s.status === 'graded');
    const pending = submissions.filter((s) => s.status !== 'graded');
    const avgGrade = graded.length
      ? Math.round(graded.reduce((acc, s) => acc + (s.final_grade ?? s.grade ?? 0), 0) / graded.length)
      : 0;
    const avgQuizScore = quizSubmissions.length
      ? Math.round(quizSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / quizSubmissions.length)
      : 0;
    const avgProgress = enrollments.length
      ? Math.round(enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / enrollments.length)
      : 0;

    return {
      courses: courses.length,
      students: new Set(enrollments.map((e) => e.student_id)).size,
      graded: graded.length,
      pending: pending.length,
      avgGrade,
      avgQuizScore,
      avgProgress,
    };
  }, [courses, enrollments, submissions, quizSubmissions]);

  const perCourse = useMemo(() => {
    return courses.map((course) => {
      const courseEnrollments = enrollments.filter((e) => e.course_id === course.id);
      const progress = courseEnrollments.length
        ? Math.round(courseEnrollments.reduce((acc, e) => acc + (e.progress || 0), 0) / courseEnrollments.length)
        : 0;
      const completed = courseEnrollments.filter((e) => e.completed).length;
      return { id: course.id, title: course.title, students: courseEnrollments.length, progress, completed };
    });
  }, [courses, enrollments]);

  /**
   * Group assignment results. One submission row is shared by a whole group,
   * so each row here is a group's single grade for that assignment.
   */
  const groupResults = useMemo(() => {
    return submissions
      .filter((s) => s.group_id && s.assignment?.assignment_type === 'group')
      .map((s) => {
        const group = (s.assignment?.groups || []).find((g) => g.id === s.group_id);
        return {
          key: s.id,
          assignment: s.assignment?.title || 'Assignment',
          course: s.assignment?.course?.title || '',
          group: group?.name || 'Group',
          members: group?.member_ids.length || 0,
          hasLeader: !!group?.leader_id,
          status: s.status,
          grade: s.status === 'graded' ? (s.final_grade ?? s.grade ?? null) : null,
          points: s.assignment?.points_possible ?? null,
        };
      })
      .sort((a, b) => a.assignment.localeCompare(b.assignment) || a.group.localeCompare(b.group));
  }, [submissions]);

  const avgGroupGrade = useMemo(() => {
    const scored = groupResults.filter((g) => g.grade !== null);
    return scored.length ? Math.round(scored.reduce((acc, g) => acc + (g.grade || 0), 0) / scored.length) : 0;
  }, [groupResults]);

  const rows: [string, string][] = [
    ['Courses', String(stats.courses)],
    ['Unique Students', String(stats.students)],
    ['Graded Submissions', String(stats.graded)],
    ['Pending Grading', String(stats.pending)],
    ['Average Assignment Grade', `${stats.avgGrade}%`],
    ['Average Quiz Score', `${stats.avgQuizScore}%`],
    ['Average Course Progress', `${stats.avgProgress}%`],
    ['Group Submissions', String(groupResults.length)],
    ['Average Group Grade', `${avgGroupGrade}%`],
  ];

  const handleExportPDF = () =>
    exportToPDF('Teaching Performance Report', ['Metric', 'Value'], rows.map((r) => [...r]), 'Teaching_Analytics');

  const handleExportCSV = () =>
    exportToCSV(rows.map(([Metric, Value]) => ({ Metric, Value })), 'Teaching_Analytics');

  const cards = [
    { label: 'Courses', value: stats.courses, tone: 'bg-blue-100 text-blue-600', emoji: '📘' },
    { label: 'Students', value: stats.students, tone: 'bg-emerald-100 text-emerald-600', emoji: '🎓' },
    { label: 'Pending Grading', value: stats.pending, tone: 'bg-amber-100 text-amber-600', emoji: '⏳' },
    { label: 'Avg Grade', value: `${stats.avgGrade}%`, tone: 'bg-purple-100 text-purple-600', emoji: '📝' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Teaching Analytics</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 px-5 py-3 rounded-2xl hover:bg-slate-200 transition-all"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-blue-600 text-white px-5 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center"
          >
            <div className={`w-16 h-16 ${c.tone} rounded-2xl flex items-center justify-center text-2xl mb-4`}>
              {c.emoji}
            </div>
            <div className="text-3xl font-bold text-slate-900">{c.value}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Course Performance</h3>
          <p className="text-xs text-slate-500 mt-1">
            Average quiz score across your courses: <span className="font-bold">{stats.avgQuizScore}%</span>
          </p>
        </div>
        {perCourse.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No courses yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {perCourse.map((c) => (
              <div key={c.id} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {c.students} students · {c.completed} completed
                  </div>
                </div>
                <div className="sm:w-64">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${c.progress}%` }} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">
                    {c.progress}% avg progress
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900">Group Results</h3>
            <p className="text-xs text-slate-500 mt-1">
              Average group grade: <span className="font-bold">{avgGroupGrade}%</span>
            </p>
          </div>
        </div>
        {groupResults.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No group submissions yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groupResults.map((g) => (
              <div key={g.key} className="p-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {g.group}
                    {g.hasLeader && <Crown size={12} className="inline ml-2 text-amber-500" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {g.assignment}
                    {g.course ? ` · ${g.course}` : ''} · {g.members} member{g.members === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {g.grade === null ? (
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full">
                      Awaiting grading
                    </span>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-slate-900">{g.grade}%</div>
                      {g.points !== null && (
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          of {g.points} pts
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
