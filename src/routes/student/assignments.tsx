import { createFileRoute } from '@tanstack/react-router';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { getEnrollments, getAssignments, getSubmissions, requestRegrade } from '@/lib/api-actions';
import { AssignmentsList } from "@/components/assessments/AssignmentsList";
import { AssignmentDTO, SubmissionDTO } from '@/lib/types';
import { dynamic } from '@/lib/next-compat';
import { useAppContext } from '@/components/AppContext';
import { FeedbackModal } from '@/components/assessments/FeedbackModal';

const AssignmentForm = dynamic(() => import("@/components/assessments/AssignmentForm").then(m => m.AssignmentForm), { ssr: false });

function AssignmentsPage() {
  const { user } = useAuth();
  const { addToast } = useAppContext();
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);
  const [activeAssignment, setActiveAssignment] = useState<AssignmentDTO | null>(null);
  const [feedbackView, setFeedbackView] = useState<{ assignment: AssignmentDTO, submission: SubmissionDTO } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
          getEnrollments(user.id),
          getAssignments(),
          getSubmissions({ studentId: user.id })
        ]);

        const enrolledIds = myEnrollments.map(e => e.course_id);
        setAssignments(allAssignments.filter(a => enrolledIds.includes(a.course_id) && a.status === 'published'));
        setSubmissions(mySubmissions);
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && assignments.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        const assignment = assignments.find(a => a.id === id);
        if (assignment) {
          setActiveAssignment(assignment);
        }
      }
    }
  }, [assignments]);

  return (
    <>
      {activeAssignment && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4">
            <AssignmentForm
                assignment={activeAssignment}
                user={user!}
                onComplete={() => { setActiveAssignment(null); fetchData(); }}
                onCancel={() => setActiveAssignment(null)}
            />
        </div>
      )}
      {feedbackView && (
          <FeedbackModal
              assignment={feedbackView.assignment}
              submission={feedbackView.submission}
              onClose={() => setFeedbackView(null)}
          />
      )}
      <AssignmentsList
          assignments={assignments}
          submissions={submissions}
          currentUserId={user?.id}
          onSubmit={(a) => setActiveAssignment(a)}
          onViewFeedback={(a) => {
              const sub = submissions.find(s => s.assignment_id === a.id);
              if (sub) {
                  setFeedbackView({ assignment: a, submission: sub });
              }
          }}
          onRegradeRequest={async (a, reason) => {
              if (!a.regrade_requests_enabled) {
                  addToast('Regrade requests are disabled for this assignment.', 'error');
                  return;
              }
              try {
                  const result = await requestRegrade(a.id, reason);
                  if (!result.success) throw new Error(result.error || 'Failed to send regrade request.');
                  addToast('Regrade request sent successfully!', 'success');
                  fetchData();
              } catch (err) {
                  console.error('Failed to send regrade request:', err);
                  addToast(err instanceof Error ? err.message : 'Failed to send regrade request.', 'error');
              }
          }}
      />
    </>
  );
}


export const Route = createFileRoute('/student/assignments')({
  head: () => ({ meta: [{ title: "Student — Assignments — SmartLMS" }] }),
  component: AssignmentsPage,
});
