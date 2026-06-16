import React from 'react';
import { AssignmentDTO, SubmissionDTO } from '@/lib/types';
import { Countdown } from '@/components/ui/Countdown';
import { FileText, Calendar, CheckCircle2, Clock, AlertCircle, MessageSquare, RotateCcw } from 'lucide-react';

interface AssignmentsListProps {
  assignments: AssignmentDTO[];
  submissions: SubmissionDTO[];
  onSubmit: (assignment: AssignmentDTO) => void;
  onViewFeedback: (assignment: AssignmentDTO) => void;
  onRegradeRequest: (assignment: AssignmentDTO, reason: string) => void;
}

export const AssignmentsList: React.FC<AssignmentsListProps> = ({ assignments, submissions, onSubmit, onViewFeedback, onRegradeRequest }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">My Assignments</h2>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {assignments.length} Total
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-5">Assignment Details</th>
                <th className="px-6 py-5">Course</th>
                <th className="px-6 py-5">Deadline</th>
                <th className="px-6 py-5">Submission Status</th>
                <th className="px-6 py-5">Performance</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-2">
                        <FileText size={40} className="text-slate-200" />
                        <span>No assignments assigned to you at this time.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                assignments.map(assignment => {
                  const isPastDue = new Date(assignment.due_date) < new Date();
                  const submission = submissions.find(s => s.assignment_id === assignment.id);
                  const isOverdue = isPastDue && !submission;

                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${submission?.status === 'graded' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{assignment.title}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">{assignment.description}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-bold text-slate-600">{assignment.course?.title || 'General'}</div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                            <div className={`flex items-center gap-1.5 text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-slate-700'}`}>
                                <Calendar size={14} className="opacity-50" />
                                {new Date(assignment.due_date).toLocaleDateString()}
                            </div>
                            {isOverdue ? (
                                <div className="inline-flex items-center gap-1 text-[9px] text-red-500 uppercase font-black tracking-widest bg-red-50 px-2 py-0.5 rounded-full w-fit">
                                    <AlertCircle size={10} /> Overdue
                                </div>
                            ) : (
                                !submission && <Countdown targetDate={assignment.due_date} compact className="text-[10px]" />
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {submission ? (
                            <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit ${submission.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {submission.status === 'graded' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    {submission.status}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium italic">Sent: {new Date(submission.submitted_at).toLocaleDateString()}</span>
                            </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 w-fit">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        {submission?.final_grade !== undefined ? (
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-black ${submission.final_grade >= 80 ? 'text-green-600' : 'text-slate-900'}`}>{submission.final_grade}%</div>
                            <div className="h-8 w-px bg-slate-100" />
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                <div className="text-slate-600">{submission.grade} PTS</div>
                                <div>OF {assignment.points_possible}</div>
                            </div>
                          </div>
                        ) : (
                            <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Ungraded</span>
                        )}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end gap-2">
                            {submission?.status === 'graded' ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onViewFeedback(assignment)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm shadow-blue-50"
                                    >
                                        <MessageSquare size={14} /> Feedback
                                    </button>
                                    {assignment.regrade_requests_enabled !== false && !submission.regrade_request && (
                                        <button
                                        onClick={() => {
                                            const reason = prompt('Reason for regrade request:');
                                            if (reason) onRegradeRequest(assignment, reason);
                                        }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-sm shadow-amber-50"
                                        >
                                            <RotateCcw size={14} /> Regrade
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => onSubmit(assignment)}
                                    disabled={isPastDue && !assignment.allow_late_submissions}
                                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                                        isOverdue ? 'bg-red-500 text-white shadow-red-100 hover:bg-red-600' : 'bg-slate-900 text-white shadow-slate-200 hover:bg-slate-800'
                                    } disabled:opacity-30 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed`}
                                >
                                    <CheckCircle2 size={16} />
                                    {isPastDue && !assignment.allow_late_submissions ? 'Submissions Closed' : (submission ? 'Resubmit' : isOverdue ? 'Submit Late' : 'Start Submission')}
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
