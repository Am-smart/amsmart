import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getCourses, getAssignments, getQuizzes, getAntiCheatLogs, getSubmissions, getQuizSubmissions } from '@/lib/api-actions';
import { AntiCheatRecord } from "@/components/system/AntiCheatRecord";
import { SubmissionDTO, QuizSubmissionDTO, AntiCheatLogDTO, CourseDTO } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 50;

function AntiCheatPage() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState<CourseDTO[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionDTO[]>([]);
  const [antiCheatLogs, setAntiCheatLogs] = useState<AntiCheatLogDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load courses on mount
  useEffect(() => {
    if (user) {
      getCourses(user.id)
        .then(courses => {
          setMyCourses(courses);
          if (courses.length > 0) {
            setSelectedCourse(courses[0].id);
          }
        })
        .catch(err => {
          console.error('Failed to load courses:', err);
          setError('Failed to load courses');
        });
    }
  }, [user]);

  // Load data when selected course or page changes
  useEffect(() => {
    if (user && selectedCourse) {
      setIsLoading(true);
      setError(null);

      Promise.all([
        getAssignments(user.id),
        getQuizzes(undefined, user.id),
        getSubmissions(),
        getQuizSubmissions(),
        getAntiCheatLogs({ 
          courseId: selectedCourse, 
          limit: PAGE_SIZE, 
          offset: currentPage * PAGE_SIZE 
        })
      ])
        .then(([allAsgns, allQuizzes, subs, quizSubs, logs]) => {
          setSubmissions(subs);
          setQuizSubmissions(quizSubs);
          setAntiCheatLogs(logs);
          // Estimate total based on whether we got a full page
          if (logs.length < PAGE_SIZE && currentPage === 0) {
            setTotalLogs(logs.length);
          } else {
            setTotalLogs(logs.length > 0 ? (currentPage + 1) * PAGE_SIZE : 0);
          }
        })
        .catch(err => {
          console.error('Failed to load anti-cheat records:', err);
          setError('Failed to load anti-cheat records');
        })
        .finally(() => setIsLoading(false));
    }
  }, [user, selectedCourse, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (antiCheatLogs.length === PAGE_SIZE) {
      setCurrentPage(currentPage + 1);
    }
  };

  const canGoPrev = currentPage > 0;
  const canGoNext = antiCheatLogs.length === PAGE_SIZE;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Anti-Cheat Monitoring</h2>
        
        {/* Course Filter */}
        {myCourses.length > 1 && (
          <select
            value={selectedCourse || ''}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setCurrentPage(0);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
          >
            {myCourses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg animate-pulse">
          Loading anti-cheat records...
        </div>
      )}

      <AntiCheatRecord
        submissions={submissions}
        quizSubmissions={quizSubmissions}
        logs={antiCheatLogs}
        isTeacher={true}
      />

      {/* Pagination Controls */}
      {antiCheatLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page <span className="font-semibold">{currentPage + 1}</span> • 
            Showing <span className="font-semibold">{antiCheatLogs.length}</span> records per page
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!canGoPrev}
              className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="flex items-center gap-1 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export const Route = createFileRoute('/teacher/anti-cheat')({
  head: () => ({ meta: [{ title: "Teacher — Anti-cheat — SmartLMS" }] }),
  component: AntiCheatPage,
});
