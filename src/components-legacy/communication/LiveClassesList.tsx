import React from 'react';
import { LiveClassDTO } from '@/lib/types';
import { Countdown } from '@/components/ui/Countdown';
import { Video, Calendar, Clock, Globe, ShieldCheck, PlayCircle, Lock } from 'lucide-react';

interface LiveClassesListProps {
  liveClasses: LiveClassDTO[];
  onJoin: (liveClass: LiveClassDTO) => void;
}

export const LiveClassesList: React.FC<LiveClassesListProps> = ({ liveClasses, onJoin }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Video className="text-red-600" size={28} />
            Live Classroom Sessions
        </h2>
        <div className="flex items-center gap-2">
            {liveClasses.some(lc => lc.status === 'live') && (
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            )}
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                {liveClasses.length} Scheduled
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 backdrop-blur-sm text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Session Details</th>
                <th className="px-8 py-5">Schedule Info</th>
                <th className="px-8 py-5">Platform Status</th>
                <th className="px-8 py-5 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {liveClasses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                            <Video size={32} className="text-slate-200" />
                        </div>
                        <p className="font-bold text-sm">No live classroom sessions are currently scheduled.</p>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-300">Check your course calendar for upcoming events.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                liveClasses.map(liveClass => {
                  const isLive = liveClass.status === 'live';
                  return (
                    <tr key={liveClass.id} id={`live-class-${liveClass.id}`} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${isLive ? 'bg-red-100 text-red-600 scale-110 ring-4 ring-red-50' : 'bg-blue-100 text-blue-600'}`}>
                              <Video size={24} />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                              {liveClass.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Globe size={10} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Virtual Classroom</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <Calendar size={14} className="text-slate-400" />
                                  {new Date(liveClass.start_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                  <Clock size={14} className="text-slate-400" />
                                  {new Date(liveClass.start_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </div>
                          </div>
                      </td>
                      <td className="px-8 py-6">
                          <div className="flex flex-col items-start gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                                {isLive ? <PlayCircle size={10} /> : <Clock size={10} />}
                                {liveClass.status}
                            </span>
                            {!isLive && liveClass.status === 'scheduled' && (
                                <Countdown
                                    targetDate={liveClass.start_at}
                                    compact
                                    className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100"
                                />
                            )}
                          </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end gap-2">
                            {isLive ? (
                                <button
                                    onClick={() => onJoin(liveClass)}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 scale-105"
                                >
                                    <PlayCircle size={16} />
                                    Join Classroom
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed border border-slate-200"
                                >
                                    <Lock size={14} />
                                    Not Started
                                </button>
                            )}
                            <div className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                                <ShieldCheck size={10} className="text-green-500" /> Secure Encryption Active
                            </div>
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
