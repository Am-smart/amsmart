"use client";

import React from 'react';
import Image from 'next/image';
import { CourseDTO } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Calendar, Trash2, Edit } from 'lucide-react';

interface CourseListProps {
  courses: CourseDTO[];
  isLoading?: boolean;
  onAction: (course: CourseDTO) => void;
  actionLabel?: string | ((course: CourseDTO) => string);
  onEdit?: (course: CourseDTO) => void;
  onDelete?: (id: string) => void;
  showStatus?: boolean;
}

const isEmoji = (str: string) => {
    return /\p{Extended_Pictographic}/u.test(str) && str.length <= 8;
};

export function CourseList({
  courses,
  isLoading = false,
  onAction,
  actionLabel = "View",
  onEdit,
  onDelete,
  showStatus = false
}: CourseListProps) {
  const [imageErrors, setImageErrors] = React.useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="h-48 bg-slate-200" />
            <CardHeader className="space-y-3">
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/4" />
              <div className="h-10 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="h-10 bg-slate-200 rounded w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
        <p className="mt-1 text-sm text-slate-500 font-medium">Get started by browsing or creating a course.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-slate-100 group">
          <div className="h-48 bg-slate-100 relative overflow-hidden">
            {course.thumbnail_url && !imageErrors[course.id] ? (
              isEmoji(course.thumbnail_url) ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-7xl group-hover:scale-110 transition-transform duration-500">
                  {course.thumbnail_url}
                </div>
              ) : (
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImageErrors(prev => ({ ...prev, [course.id]: true }))}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                <BookOpen className="h-12 w-12 text-indigo-200" />
              </div>
            )}
            {showStatus && (
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
                course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {course.status.toUpperCase()}
              </div>
            )}
          </div>

          <CardHeader>
            <CardTitle className="line-clamp-1">{course.title}</CardTitle>
            <CardDescription className="line-clamp-1 text-xs font-bold text-slate-400 uppercase tracking-widest">
              BY {course.created_by || 'Instructor'}
            </CardDescription>
            <CardDescription className="line-clamp-2 h-10 mt-2">
              {course.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Updated {new Date(course.updated_at || course.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-2 border-t pt-4">
            <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onAction(course)}
            >
              {typeof actionLabel === 'function' ? actionLabel(course) : actionLabel}
            </Button>

            {(onEdit || onDelete) && (
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(course)}>
                    <Edit className="h-4 w-4 text-gray-600" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(course.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
