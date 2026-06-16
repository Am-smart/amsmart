import React from 'react';
import { CourseDTO } from '@/lib/types';
import { Plus, BookOpen, MoreVertical, Trash2, Edit } from 'lucide-react';

interface CourseManagerProps {
    courses: CourseDTO[];
    onCreate: () => void;
    onEdit: (course: CourseDTO) => void;
    onManageLessons: (course: CourseDTO) => void;
    onDelete: (id: string) => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({ courses, onCreate, onEdit, onManageLessons, onDelete }) => {
    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                <button onClick={onCreate} className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Create Course
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mb-6">
                            <BookOpen size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No courses yet</h3>
                        <p className="text-slate-500 mt-2 font-medium">Get started by creating your first learning track.</p>
                        <button onClick={onCreate} className="btn-secondary mt-8">Create First Course</button>
                    </div>
                ) : (
                    courses.map(course => (
                        <div key={course.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 flex justify-between items-start">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {course.status}
                                </span>
                                <div className="p-2 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer text-white transition-colors">
                                    <MoreVertical size={16} />
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{course.title}</h3>
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[32px] font-medium leading-relaxed">{course.description}</p>

                                <div className="mt-8 flex gap-2">
                                    <button onClick={() => onManageLessons(course)} className="btn-primary flex-1 py-2 text-[10px] uppercase font-bold tracking-widest">Lessons</button>
                                    <button onClick={() => onEdit(course)} className="p-2 bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => onDelete(course.id)} className="p-2 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
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
};
