import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { dynamic } from '@/lib/next-compat';
import { useAuth } from '@/components/auth/AuthContext';
import * as actions from '@/lib/api-actions';
import { AssignmentDTO } from '@/lib/types';
import { CourseDTO } from '@/lib/types';
import { Trash2, Edit } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';

const AssignmentEditor = dynamic(() => import("@/components/assessments/AssignmentEditor").then(mod => mod.AssignmentEditor), {
    loading: () => <div className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex items-center justify-center font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Editor...</div>
});

function AssignmentsPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentDTO | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async () => {
      if (!user) return;
      try {
          const myCourses = await actions.getCourses(user.id);
          setCourses(myCourses);
          const myAssignments = await actions.getAssignments(user.id);
          setAssignments(myAssignments);
      } catch (err) {
          console.error('Failed to fetch assignments:', err);
      }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this assignment?')) return;
      try {
          await actions.deleteAssignment(id);
          addToast('Assignment deleted successfully', 'success');
          fetchData();
      } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to delete assignment';
          addToast(msg, 'error');
      }
  };

  return (
    <div className="space-y-6">
        {(isAdding || editingAssignment) && (
            <div className="fixed inset-0 z-[60] overflow-y-auto">
                <AssignmentEditor
                    teacherId={user!.id}
                    assignment={editingAssignment || undefined}
                    courses={courses}
                    onSave={() => { setEditingAssignment(null); setIsAdding(false); fetchData(); }}
                    onCancel={() => { setEditingAssignment(null); setIsAdding(false); }}
                />
            </div>
        )}
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
            <button onClick={() => setIsAdding(true)} className="btn-primary">Create Assignment</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.length === 0 ? (
                <div className="col-span-full py-12 bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-500 italic">
                    No assignments created yet.
                </div>
            ) : (
                assignments.map(a => (
                    <div key={a.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg mb-2 text-slate-900 line-clamp-1">{a.title}</h3>
                        <p className="text-slate-500 text-sm mb-4 line-clamp-2 min-h-[40px]">{a.description}</p>
                        <div className="flex justify-between items-center pt-4 border-t">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${a.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>
                                {a.status}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingAssignment(a)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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


export const Route = createFileRoute('/teacher/assignments')({
  head: () => ({ meta: [{ title: "Teacher — Assignments — SmartLMS" }] }),
  component: AssignmentsPage,
});
