import React, { useState, useMemo } from 'react';
import { SubmissionDTO, QuizSubmissionDTO, AntiCheatLogDTO } from '@/lib/types';
import { ANTI_CHEAT_VIOLATIONS } from '@/lib/constants';
import { Shield, Clock, Monitor, Globe, Eye, AlertTriangle, ShieldAlert, ShieldCheck, Activity, MousePointer2, Layers, X } from 'lucide-react';

interface AntiCheatRecordProps {
  submissions: SubmissionDTO[];
  quizSubmissions: QuizSubmissionDTO[];
  logs?: AntiCheatLogDTO[];
  isTeacher?: boolean;
}

export const AntiCheatRecord: React.FC<AntiCheatRecordProps> = ({ submissions, quizSubmissions, logs, isTeacher }) => {
  const [selectedAssessment, setSelectedAssessment] = useState<{ id: string, title: string, type: string, studentId?: string, submittedAt: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedAssessmentFilter, setSelectedAssessmentFilter] = useState<string | null>(null);

  const allAssessments = useMemo(() => [
    ...submissions.map(s => ({
        id: s.id,
        type: 'Assignment',
        title: s.assignment?.title || 'Unknown',
        violations: (s).violation_count as number || 0,
        status: s.status,
        submittedAt: s.submitted_at,
        student: s.student?.full_name,
        studentId: s.student_id
    })),
    ...quizSubmissions.map(s => ({
        id: s.id,
        type: 'Quiz',
        title: s.quiz?.title || 'Unknown',
        violations: (s).violation_count as number || 0,
        status: (s).status as string,
        submittedAt: s.submitted_at,
        student: s.student?.full_name,
        studentId: s.student_id
    }))
  ].filter(s => s.status === 'submitted' || s.status === 'graded' || s.status === 'in progress')
   .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  , [submissions, quizSubmissions]);

  // Get unique students for filtering (teacher view)
  const uniqueStudents = useMemo(() => {
    const students = new Map<string, string>();
    allAssessments.forEach(a => {
      if (a.studentId && a.student) {
        students.set(a.studentId, a.student);
      }
    });
    return Array.from(students.entries());
  }, [allAssessments]);

  // Get unique assessments for filtering
  const uniqueAssessments = useMemo(() => {
    const assessments = new Map<string, { title: string, type: string }>();
    allAssessments.forEach(a => {
      assessments.set(a.id, { title: a.title, type: a.type });
    });
    return Array.from(assessments.entries());
  }, [allAssessments]);

  // Apply filters to assessments
  const filteredAssessments = useMemo(() => {
    return allAssessments.filter(a => {
      const matchesStudent = !selectedStudent || a.studentId === selectedStudent;
      const matchesAssessment = !selectedAssessmentFilter || a.id === selectedAssessmentFilter;
      return matchesStudent && matchesAssessment;
    });
  }, [allAssessments, selectedStudent, selectedAssessmentFilter]);

  const stats = useMemo(() => {
    const filteredLogs = selectedAssessment && logs
        ? logs.filter(l =>
            (l.resource_id === selectedAssessment.id || l.metadata?.assessmentTitle === selectedAssessment.title || l.message?.includes(selectedAssessment.title)) &&
            (!isTeacher || l.user_id === selectedAssessment.studentId)
        )
        : [];

    const violationScore = filteredLogs.reduce((acc, log) => {
        const type = log.type as keyof typeof ANTI_CHEAT_VIOLATIONS;
        return acc + (ANTI_CHEAT_VIOLATIONS[type]?.score || 1);
    }, 0);

    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
        counts[l.type] = (counts[l.type] || 0) + 1;
    });

    const mostFrequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    const tabSwitches = counts['TAB_SWITCH'] || 0;
    const blockedActions = (counts['RIGHT_CLICK'] || 0) + (counts['COPY_ATTEMPT'] || 0) + (counts['PASTE_ATTEMPT'] || 0) + (counts['SELECTION_ATTEMPT'] || 0);

    let riskLevel = 'LOW';
    if (violationScore >= 20) riskLevel = 'CRITICAL';
    else if (violationScore >= 12) riskLevel = 'HIGH';
    else if (violationScore >= 5) riskLevel = 'MEDIUM';

    const lastLog = filteredLogs[filteredLogs.length - 1];

    // Extract device/browser from metadata
    const firstLogWithInfo = filteredLogs.find(l => l.metadata?.userAgent);
    const userAgent = firstLogWithInfo?.metadata?.userAgent as string || 'Unknown';

    let browser = 'Unknown';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari')) browser = 'Safari';

    let device = 'Desktop';
    if (/Mobi|Android/i.test(userAgent)) device = 'Mobile';
    else if (/Tablet|iPad/i.test(userAgent)) device = 'Tablet';

    return {
        totalViolations: filteredLogs.length,
        violationScore,
        riskLevel,
        lastViolation: lastLog ? (ANTI_CHEAT_VIOLATIONS[lastLog.type as keyof typeof ANTI_CHEAT_VIOLATIONS]?.label || lastLog.type) : 'None',
        mostFrequent: ANTI_CHEAT_VIOLATIONS[mostFrequent as keyof typeof ANTI_CHEAT_VIOLATIONS]?.label || mostFrequent,
        tabSwitches,
        blockedActions,
        device,
        browser,
        filteredLogs: [...filteredLogs].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    };
  }, [selectedAssessment, logs, isTeacher]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="text-blue-600" />
                {isTeacher ? 'Security Monitoring Dashboard' : 'My Security Record'}
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
            {isTeacher
                ? 'Centralized integrity hub for student assessment violations and risk analysis.'
                : 'Your personal security footprint and violation summary for recent assessments.'
            }
            </p>
        </div>
        {!isTeacher && (
            <div className="flex gap-2">
                <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" />
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Status: Protected</span>
                </div>
            </div>
        )}
      </div>

      {selectedAssessment && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
            {/* Session Information */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Monitor size={18} className="text-slate-400" />
                        Session Information
                    </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100">
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assessment Type</label>
                        <div className="text-sm font-black text-slate-900">{selectedAssessment.type}</div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Session Time</label>
                        <div className="text-sm font-black text-slate-900">{new Date(selectedAssessment.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Session Duration</label>
                        <div className="text-sm font-black text-slate-900">0 min</div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Device</label>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <Monitor size={14} className="text-slate-400" />
                            {stats.device}
                        </div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Browser</label>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <Globe size={14} className="text-slate-400" />
                            {stats.browser}
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Activity size={18} className="text-slate-400" />
                        Statistics
                    </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-slate-100">
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Violations</label>
                        <div className="text-2xl font-black text-slate-900">{stats.totalViolations}</div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Violation Score</label>
                        <div className="text-2xl font-black text-red-600">{stats.violationScore}</div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Risk Level</label>
                        <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                stats.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' :
                                stats.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                stats.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                'bg-green-100 text-green-700 border-green-200'
                            }`}>
                                {stats.riskLevel}
                            </span>
                        </div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Last Violation</label>
                        <div className="text-sm font-black text-slate-900 truncate" title={stats.lastViolation}>{stats.lastViolation}</div>
                    </div>
                    <div className="p-4 md:p-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Most Frequent</label>
                        <div className="text-sm font-black text-slate-900 truncate" title={stats.mostFrequent}>{stats.mostFrequent}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                    <div className="p-4 md:p-6 flex items-center justify-between">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tab Switches</label>
                            <div className="text-2xl font-black text-slate-900">{stats.tabSwitches}</div>
                        </div>
                        <Layers size={32} className="text-slate-100" />
                    </div>
                    <div className="p-4 md:p-6 flex items-center justify-between">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Blocked Actions</label>
                            <div className="text-2xl font-black text-slate-900">{stats.blockedActions}</div>
                        </div>
                        <MousePointer2 size={32} className="text-slate-100" />
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-blue-500" />
                  Assessment History
              </h3>
              {(selectedAssessment || selectedStudent || selectedAssessmentFilter) && (
                  <button
                      onClick={() => {
                        setSelectedAssessment(null);
                        setSelectedStudent(null);
                        setSelectedAssessmentFilter(null);
                      }}
                      className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                      <X size={14} />
                      Reset All Filters
                  </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4">
              {isTeacher && uniqueStudents.length > 0 && (
                <select
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value || null)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Students</option>
                  {uniqueStudents.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}

              {uniqueAssessments.length > 0 && (
                <select
                  value={selectedAssessmentFilter || ''}
                  onChange={(e) => setSelectedAssessmentFilter(e.target.value || null)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Assessments</option>
                  {uniqueAssessments.map(([id, { title, type }]) => (
                    <option key={id} value={id}>{title} ({type})</option>
                  ))}
                </select>
              )}

              {(selectedStudent || selectedAssessmentFilter) && (
                <div className="text-sm text-slate-600 flex items-center gap-1 px-2">
                  <span className="font-semibold">{filteredAssessments.length}</span> result(s)
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
                <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Assessment Title</th>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-center">Security Flags</th>
                    <th className="px-6 py-4">Session Status</th>
                    <th className="px-6 py-4">Timestamp</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredAssessments.length === 0 ? (
                    <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                      {allAssessments.length === 0 
                        ? 'No assessment footprint detected.' 
                        : 'No assessments match the selected filters.'}
                    </td>
                    </tr>
                ) : (
                    filteredAssessments.map(record => (
                    <tr
                        key={`${record.type}-${record.id}`}
                        className={`hover:bg-blue-50/30 transition-all cursor-pointer group ${selectedAssessment?.id === record.id ? 'bg-blue-50/50' : ''}`}
                        onClick={() => setSelectedAssessment({ id: record.id, title: record.title, type: record.type, studentId: record.studentId, submittedAt: record.submittedAt })}
                    >
                        <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{record.title}</div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-600">{record.student || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-500 px-2 py-1 bg-slate-100 rounded-md uppercase">{record.type}</span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex justify-center">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black text-xs ${record.violations > 0 ? 'bg-red-100 text-red-600 border border-red-200 shadow-sm' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                    {record.violations}
                                </span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                            record.status === 'graded' ? 'text-green-600 bg-green-50 border-green-100' :
                            record.status === 'submitted' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                            'text-amber-600 bg-amber-50 border-amber-100'
                        }`}>
                            {record.status}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-mono text-slate-400 uppercase">
                        {new Date(record.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
          </div>
        </div>

        {selectedAssessment && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-red-500" />
                  Technical Violation Ledger: {selectedAssessment.title}
              </h3>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
              >
                Close Logs
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                    <th className="px-6 py-3 w-12 text-center">#</th>
                    <th className="px-6 py-3 w-48">Event Clock</th>
                    <th className="px-6 py-3">Security Violation Event</th>
                    <th className="px-6 py-3 w-24 text-center">Score</th>
                    <th className="px-6 py-3">Technical Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic text-sm font-medium">
                        No security flags recorded for this specific assessment session.
                      </td>
                    </tr>
                  ) : (
                    stats.filteredLogs.map((log, index) => {
                      const vInfo = ANTI_CHEAT_VIOLATIONS[log.type as keyof typeof ANTI_CHEAT_VIOLATIONS];
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-xs font-black text-slate-400 text-center">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[11px] font-black text-slate-700 leading-none mb-1">
                              {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + new Date(log.created_at).getMilliseconds().toString().padStart(3, '0') : 'N/A'}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 leading-none tracking-tight">
                              UNIX: {log.created_at ? (new Date(log.created_at).getTime() / 1000).toFixed(3) : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-red-600 uppercase tracking-tight">
                                    {vInfo?.label || String(log.type).replace(/_/g, ' ')}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium">{vInfo?.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              + {vInfo?.score || 1}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] text-slate-500 font-mono italic max-w-xs truncate">
                            {log.metadata?.duration ? `duration: ${log.metadata.duration}ms` :
                             log.metadata?.x ? `pos: (${log.metadata.x}, ${log.metadata.y}), obj: ${log.metadata.target}` :
                             log.metadata?.target ? `target: ${log.metadata.target}` :
                             log.metadata?.shortcut ? `shortcut: ${log.metadata.shortcut}` :
                             log.message}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isTeacher && logs && !selectedAssessment && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-white">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-red-500" />
                  Live Security Stream
              </h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Student Identity</th>
                    <th className="px-6 py-4">Security Event</th>
                    <th className="px-6 py-4">Source Assessment</th>
                    <th className="px-6 py-4">Data Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">No live security logs available.</td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase">
                          {log.created_at ? new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-black text-slate-900">{log.user?.full_name || 'System'}</div>
                          <div className="text-[9px] text-slate-400 font-medium">{log.user?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                              ANTI_CHEAT_VIOLATIONS[log.type as keyof typeof ANTI_CHEAT_VIOLATIONS]?.severity >= 4 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {ANTI_CHEAT_VIOLATIONS[log.type as keyof typeof ANTI_CHEAT_VIOLATIONS]?.label || String(log.type).replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[11px] font-bold text-slate-600">
                          {String(log.metadata?.assessmentTitle || log.course?.title || 'Unknown Assessment')}
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-mono italic max-w-xs truncate">
                          {log.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
