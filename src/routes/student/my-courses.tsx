import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments } from '@/lib/api-actions';
import { MyCourses } from "@/components/courses/MyCourses";
import { EnrollmentDTO } from '@/lib/types';
import { useRouter } from '@/lib/next-compat';

function MyCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      getEnrollments(user.id)
        .then(setEnrollments)
        .catch(err => {
          console.error('Failed to load enrollments:', err);
          setError('Failed to load your courses');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <div className="animate-pulse">Loading courses...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <MyCourses
        enrollments={enrollments}
        onOpenCourse={(id) => router.push(`/student/courses?id=${id}`)}
    />
  );
}


export const Route = createFileRoute('/student/my-courses')({
  head: () => ({ meta: [{ title: "Student — My-courses — SmartLMS" }] }),
  component: MyCoursesPage,
});
