import React from 'react';
import { EnrollmentDTO } from '@/lib/types';
import { Trash2, FileSpreadsheet, FileText, UserMinus, GraduationCap, BookOpen, BarChart } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { unenrollStudent } from '@/lib/api-actions';
import { exportToCSV, exportToPDF } from '@/lib/report-utils';

interface StudentManagementProps {
    initialEnrollments: EnrollmentDTO[];
    onRefresh: () => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ initialEnrollments, onRefresh }) => {
    const { addToast } = useAppContext();

    const handleUnenroll = async (courseId: string, studentId: string) => {
        if (!confirm('Are you sure you want to unenroll this student?')) return;
        try {
            const res = await unenrollStudent(courseId, studentId);
            if (!res.success) throw new Error(res.error);
            onRefresh();
            addToast('Student unenrolled successfully', 'success');
        } catch (err) {
            console.error('Unenroll failed:', err);
            addToast('Failed to unenroll student', 'error');
        }
    };

    const handleExportCSV = () => {
        const data = initialEnrollments.map(e => ({
            Student: e.student?.full_name || 'Unknown',
            Email: e.student?.email || 'N/A',
            Course: e.course?.title || 'N/A',
            Progress: `${e.progress}%`,
            Enrolled: e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'N/A'
        }));
        exportToCSV(data, 'Student_Management_Report');
    };

    const handleExportPDF = () => {
        const headers = ['Student', 'Course', 'Progress', 'Enrolled'];
        const rows = initialEnrollments.map(e => [
            e.student?.full_name || 'Unknown',
            e.course?.title || 'N/A',
            `${e.progress}%`,
            e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'N/A'
        ]);
        exportToPDF('Student Management Report', headers, rows, 'Student_Management_Report');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="text-blue-600" size={24} />
                        Student Management
                    </h2>
                    <div className="flex gap-4 mt-1">
                        <button onClick={handleExportCSV} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-green-600 transition-colors">
                            <FileSpreadsheet size={14} /> CSV
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-red-600 transition-colors">
                            <FileText size={14} /> PDF
                        </button>
                    </div>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                    {initialEnrollments.length} Total Enrollments
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full text-left min-w-[800px] border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="px-8 py-5">Student Information</th>
                                <th className="px-8 py-5">Enrolled Course</th>
                                <th className="px-8 py-5">Course Progress</th>
                                <th className="px-8 py-5 text-right">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {initialEnrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center text-slate-400 italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <GraduationCap size={40} className="text-slate-200" />
                                            <span>No students enrolled in any courses yet.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                initialEnrollments.map(e => {
                                    const student = e.student;
                                    return (
                                        <tr key={`${e.course_id}-${e.student_id}`} className="hover:bg-slate-50/30 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                                        {student?.full_name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{student?.full_name || 'Unknown Student'}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{student?.email}</div>
                                                        <div className="text-[9px] text-slate-400 font-medium italic mt-0.5">ID: {e.student_id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                    <BookOpen size={14} className="text-slate-400" />
                                                    {e.course?.title}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium mt-1">Joined {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'N/A'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-2 min-w-[150px]">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <BarChart size={10} /> Progress
                                                        </span>
                                                        <span className="text-xs font-black text-slate-900">{e.progress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${e.progress >= 80 ? 'bg-green-500' : e.progress >= 40 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                            style={{ width: `${e.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => handleUnenroll(e.course_id, e.student_id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest shadow-sm shadow-red-100"
                                                    title="Unenroll Student"
                                                >
                                                    <UserMinus size={14} />
                                                    <span className="hidden sm:inline">Unenroll</span>
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
        </div>
    );
};
