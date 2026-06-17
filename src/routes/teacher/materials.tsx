import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getMaterials } from '@/lib/api-actions';
import { MaterialManager } from "@/components/courses/MaterialManager";
import { MaterialDTO, CourseDTO } from '@/lib/types';

function MaterialsPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const myCourses = await getCourses(user.id);
      setCourses(myCourses);
      const materials = await getMaterials(); // Service layer filters by teacher's ownership
      setMaterials(materials);
    } catch (err) {
      console.error('Failed to load materials:', err);
      setError('Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <div className="animate-pulse">Loading materials...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return (
    <MaterialManager
        initialMaterials={materials}
        courses={courses}
        onRefresh={fetchData}
    />
  );
}


export const Route = createFileRoute('/teacher/materials')({
  head: () => ({ meta: [{ title: "Teacher — Materials — SmartLMS" }] }),
  component: MaterialsPage,
});
