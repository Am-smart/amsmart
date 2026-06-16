import React from 'react';
import { EnrollmentDTO } from '@/lib/types';

interface MyCoursesProps {
  enrollments: EnrollmentDTO[];
  onOpenCourse: (courseId: string) => void;
}

export const MyCourses: React.FC<MyCoursesProps> = ({ enrollments, onOpenCourse }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">My Enrolled Courses</h2>
      {enrollments.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
          <p className="text-slate-500">You haven&apos;t enrolled in any courses yet. Visit the Catalog to find some!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map(enrollment => {
            const course = enrollment.course;
            if (!course) return null;
            return (
              <div key={enrollment.course_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-4xl text-white">📖</div>
                <h3 className="text-lg font-bold">{course.title}</h3>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: `${enrollment.progress || 0}%` }}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{enrollment.progress || 0}% Complete</span>
                  {enrollment.completed && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Completed</span>}
                </div>
                <p className="text-slate-500 text-sm line-clamp-2 flex-1">{course.description}</p>
                <button onClick={() => onOpenCourse(course.id)} className="btn-primary text-sm py-2">Open Course</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
