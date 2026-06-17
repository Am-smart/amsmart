import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import * as actions from '@/lib/api-actions';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { CourseView } from "@/components/courses/CourseView";
import { CourseDTO, LessonDTO, EnrollmentDTO } from '@/lib/types';
import { useRouter, useSearchParams } from '@/lib/next-compat';
import { useAppContext } from '@/components/AppContext';
import { CourseList } from '@/components/common/CourseList';

function CatalogContent() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const { isOnline, addToQueue } = useIndexedDB();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<CourseDTO | null>(null);
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState<CourseDTO | null>(null);
  const [enrollCodeInput, setEnrollCodeInput] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('id');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
        const [all, enrolled] = await Promise.all([
          actions.getCourses(),
          actions.getEnrollments(user.id)
        ]);
        setCourses(all.filter(c => c.status === 'published'));
        setEnrollments(enrolled);
    } catch (err) {
        console.error('Failed to fetch catalog data:', err);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isLoading) return;

    if (courseIdParam) {
        // Find course in catalog or in student's enrollments
        const enrolledCourse = enrollments.find(e => e.course_id === courseIdParam)?.course;
        const catalogCourse = courses.find(item => item.id === courseIdParam);

        const c = enrolledCourse || catalogCourse;
        const isEnrolled = enrollments.some(e => e.course_id === courseIdParam);

        if (c && isEnrolled) {
            setActiveCourse(c);
            actions.getLessons(c.id).then(data => setLessons(data || []));
        } else if (c && !isEnrolled) {
            addToast("You must be enrolled to view course content.", "error");
            router.push('/student/courses');
        } else if (!c && !isLoading) {
            addToast("Course not found.", "error");
            router.push('/student/courses');
        }
    } else {
        setActiveCourse(null);
    }
  }, [courseIdParam, courses, enrollments, isLoading, addToast, router]);

  const handleEnroll = async (course: CourseDTO, code?: string) => {
    if (!user) return;

    try {
      if (isOnline) {
          const res = await actions.enrollInCourse(course.id, code);
          if (res.success) {
            addToast('Successfully enrolled in course!', 'success');
          } else {
            throw new Error(res.error);
          }
      } else {
          await addToQueue('ENROLL', { course_id: course.id, student_id: user.id, enrollmentCode: code }, user.sessionId);
          addToast('Offline: Enrollment queued for synchronization.', 'info');
      }
      router.push(`/student/courses?id=${course.id}`);
    } catch (err) {
      console.error('Enrollment failed:', err);
      const msg = err instanceof Error ? err.message : 'Failed to enroll in course. Please try again.';
      addToast(msg, 'error');
    }
  };

  if (activeCourse) {
      return (
          <CourseView
              course={activeCourse}
              lessons={lessons}
              onBack={() => router.push('/student/courses')}
          />
      );
  }

  return (
    <div className="p-6">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
            <p className="text-gray-600 mt-2">Explore and enroll in available courses.</p>
        </div>

        <CourseList
            courses={courses}
            isLoading={isLoading}
            onAction={(course) => {
                const isEnrolled = enrollments.some(e => e.course_id === course.id);
                if (isEnrolled) {
                    router.push(`/student/courses?id=${course.id}`);
                } else {
                    if (course.enrollment_id && course.enrollment_id.trim() !== '') {
                        setShowEnrollModal(course);
                    } else {
                        handleEnroll(course);
                    }
                }
            }}
            actionLabel={(course) => enrollments.some(e => e.course_id === course.id) ? "View Details" : "Enroll Now"}
        />

        {showEnrollModal && (
            <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-300">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Enrollment Required</h2>
                    <p className="text-slate-500 mb-6">This course requires an enrollment code to join. Please enter the code provided by your instructor.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2 tracking-wide">Enrollment Code</label>
                            <input
                                type="text"
                                value={enrollCodeInput}
                                onChange={(e) => setEnrollCodeInput(e.target.value)}
                                className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter code here..."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button
                                onClick={() => { setShowEnrollModal(null); setEnrollCodeInput(''); }}
                                className="btn-secondary flex-1 py-4 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleEnroll(showEnrollModal, enrollCodeInput);
                                    setShowEnrollModal(null);
                                    setEnrollCodeInput('');
                                }}
                                disabled={!enrollCodeInput.trim()}
                                className="btn-primary flex-1 py-4 text-sm"
                            >
                                Join Course
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

function CatalogPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CatalogContent />
    </Suspense>
  );
}


export const Route = createFileRoute('/student/courses')({
  head: () => ({ meta: [{ title: "Student — Courses — SmartLMS" }] }),
  component: CatalogPage,
});
