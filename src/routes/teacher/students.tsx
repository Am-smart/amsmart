import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getEnrollments } from '@/lib/api-actions';
import { StudentManagement } from "@/components/users/StudentManagement";
import { EnrollmentDTO } from '@/lib/types';

function StudentManagementPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await getCourses(user.id);
      const courseIds = myCourses.map(c => c.id);
      if (courseIds.length > 0) {
        const data = await getEnrollments(undefined, courseIds);
        setEnrollments(data || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading students...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <StudentManagement
        initialEnrollments={enrollments}
        onRefresh={fetchData}
    />
  );
}


export const Route = createFileRoute('/teacher/students')({
  head: () => ({ meta: [{ title: "Teacher — Students — SmartLMS" }] }),
  component: StudentManagementPage,
});
