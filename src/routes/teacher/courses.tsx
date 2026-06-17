import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import * as actions from '@/lib/api-actions';
import dynamic from 'next/dynamic';

const CourseEditor = dynamic(() => import('@/components/courses/CourseEditor').then(mod => mod.CourseEditor), {
    loading: () => <div className="h-96 bg-slate-100 animate-pulse rounded-lg" />
});

const LessonEditor = dynamic(() => import('@/components/courses/LessonEditor').then(mod => mod.LessonEditor), {
    loading: () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg animate-pulse w-full max-w-4xl h-[80vh]" />
    </div>
});
import { CourseDTO } from '@/lib/types';
import { CourseList } from '@/components/common/CourseList';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [editingCourse, setEditingCourse] = useState<CourseDTO | null>(null);
  const [activeLessonCourse, setActiveLessonCourse] = useState<CourseDTO | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (user) {
        const data = await actions.getCourses(user.id);
        setCourses(data);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                <p className="text-gray-600 mt-2">Manage your teaching curriculum and lessons.</p>
            </div>
            <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Course
            </Button>
        </div>

      {(isAdding || editingCourse) && (
        <CourseEditor
            teacherId={user!.id}
            course={editingCourse || undefined}
            onSave={() => { setEditingCourse(null); setIsAdding(false); fetchCourses(); }}
            onCancel={() => { setEditingCourse(null); setIsAdding(false); }}
        />
      )}

      <CourseList
        courses={courses}
        onAction={(course) => setActiveLessonCourse(course)}
        actionLabel="Manage Lessons"
        onEdit={setEditingCourse}
        onDelete={async (id) => {
            if (!confirm('Are you sure you want to delete this course and all its lessons?')) return;
            await actions.deleteCourse(id);
            fetchCourses();
        }}
        showStatus={true}
      />

      {activeLessonCourse && (
          <LessonEditor
              course={activeLessonCourse}
              onClose={() => setActiveLessonCourse(null)}
          />
      )}
    </div>
  );
}


export const Route = createFileRoute('/teacher/courses')({
  head: () => ({ meta: [{ title: "Teacher — Courses — SmartLMS" }] }),
  component: CoursesPage,
});
