import React from 'react';
import { MaterialDTO } from '@/lib/types';
import { FileText, Download, Calendar, BookOpen, ExternalLink, Shield } from 'lucide-react';

interface MaterialsListProps {
  materials: MaterialDTO[];
}

export const MaterialsList: React.FC<MaterialsListProps> = ({ materials }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-blue-600" size={28} />
            Study Materials
        </h2>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-4 py-2 rounded-full shadow-sm border border-slate-200">
            {materials.length} Resources
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 backdrop-blur-sm text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Material Description</th>
                <th className="px-8 py-5">Shared On</th>
                <th className="px-8 py-5">Security</th>
                <th className="px-8 py-5 text-right">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                            <BookOpen size={32} className="text-slate-200" />
                        </div>
                        <p className="font-bold text-sm">No course materials have been shared with you yet.</p>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-300">Check back later or contact your instructor.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                materials.map(material => (
                  <tr key={material.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <FileText size={24} className="text-blue-600" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <h3 className="font-black text-slate-800 text-sm group-hover:text-blue-700 transition-colors truncate max-w-[300px]">
                            {material.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PDF Document</span>
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Resource</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(material.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                    </td>
                    <td className="px-8 py-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Shield size={12} /> Encrypted
                        </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-200"
                            title="Download Material"
                        >
                            <Download size={14} />
                            Download
                        </a>
                        <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-50"
                            title="View Online"
                        >
                            <ExternalLink size={18} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
