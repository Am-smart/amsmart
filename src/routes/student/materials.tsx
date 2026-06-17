import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getMaterials } from '@/lib/api-actions';
import { MaterialsList } from "@/components/courses/MaterialsList";
import { MaterialDTO } from '@/lib/types';

function MaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<MaterialDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      setError(null);
      getEnrollments(user.id)
        .then(e => {
          const enrolledIds = e.map(item => item.course_id);
          if (enrolledIds.length > 0) {
            return getMaterials().then(allMaterials => 
              allMaterials.filter(m => enrolledIds.includes(m.course_id))
            );
          } else {
            return [];
          }
        })
        .then(setMaterials)
        .catch(err => {
          console.error('Failed to load materials:', err);
          setError('Failed to load materials');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  if (isLoading) return <div className="animate-pulse">Loading materials...</div>;
  if (error) return <div className="text-red-600 font-semibold">{error}</div>;

  return <MaterialsList materials={materials} />;
}


export const Route = createFileRoute('/student/materials')({
  head: () => ({ meta: [{ title: "Student — Materials — SmartLMS" }] }),
  component: MaterialsPage,
});
