import React, { useState, useEffect } from 'react';
import { SubmissionDTO } from '@/lib/types';
import { Clock, RotateCcw, User, FileText, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

interface GradingQueueProps {
  submissions: SubmissionDTO[];
  onGrade: (submission: SubmissionDTO) => void;
  onPageChange?: (page: number) => void;
  currentPage?: number;
}

export const GradingQueue: React.FC<GradingQueueProps> = ({ submissions, onGrade, onPageChange, currentPage: controlledPage }) => {
  // Pending grading includes new submissions and regrade requests
  // Memoize filtered data for performance
  const pending = React.useMemo(() => submissions.filter(s => s.status === 'submitted' || !!s.regrade_request), [submissions]);

  const [localPage, setLocalPage] = useState(1);
  const itemsPerPage = 10;

  const currentPage = controlledPage !== undefined ? controlledPage : localPage;
  const totalPages = Math.max(1, Math.ceil(pending.length / itemsPerPage));

  const handlePageChange = (p: number) => {
    if (onPageChange) {
        onPageChange(p);
    } else {
        setLocalPage(p);
    }
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
        handlePageChange(totalPages);
    }
  }, [pending.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  // If onPageChange is provided, we assume submissions are already paginated by parent
  const displaySubmissions = onPageChange ? pending : pending.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Grading Queue</h2>
        <div className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200 shadow-sm">
            {pending.length} Submissions Pending
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="px-8 py-5">Student Information</th>
                        <th className="px-8 py-5">Assignment Content</th>
                        <th className="px-8 py-5">Request Type</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {pending.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                        <CheckCircle2 size={32} className="text-slate-200" />
                                    </div>
                                    <p>Everything is caught up! No pending submissions to grade.</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        displaySubmissions.map(sub => (
                            <tr key={sub.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{sub.student?.full_name || 'Anonymous Student'}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">Submitted: {new Date(sub.submitted_at).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                        <FileText size={14} className="text-slate-400 shrink-0" />
                                        {sub.assignment?.title || 'Unknown Assignment'}
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 italic">
                                        Course ID: {sub.assignment?.course_id.substring(0, 8)}...
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    {sub.regrade_request ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border border-amber-200">
                                                <RotateCcw size={12} /> Regrade Request
                                            </span>
                                            <p className="text-[10px] text-slate-500 italic line-clamp-1 max-w-[200px]">&ldquo;{sub.regrade_request}&rdquo;</p>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest w-fit border border-blue-100">
                                            <Clock size={12} /> Initial Grading
                                        </span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button
                                        onClick={() => onGrade(sub)}
                                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md ${
                                            sub.regrade_request ? 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600' : 'bg-slate-900 text-white shadow-slate-100 hover:bg-slate-800'
                                        }`}
                                    >
                                        <CheckCircle2 size={16} />
                                        Grade Now
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white px-8 py-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-xs font-bold text-slate-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, pending.length)} of {pending.length} results
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => handlePageChange(i + 1)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                currentPage === i + 1 ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-500'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
