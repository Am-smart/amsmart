-- Compound / sort-supporting indexes for high-volume list queries.
CREATE INDEX IF NOT EXISTS idx_discussions_course_created ON public.discussions (course_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_user ON public.discussions (user_id);

CREATE INDEX IF NOT EXISTS idx_broadcasts_created ON public.broadcasts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcasts_course ON public.broadcasts (course_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_expires ON public.broadcasts (expires_at);

CREATE INDEX IF NOT EXISTS idx_materials_teacher ON public.materials (teacher_id);
CREATE INDEX IF NOT EXISTS idx_materials_course_created ON public.materials (course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson ON public.lesson_completions (lesson_id);

CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_status ON public.submissions (assignment_id, status);

CREATE INDEX IF NOT EXISTS idx_quiz_submissions_submitted_at ON public.quiz_submissions (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student_quiz ON public.quiz_submissions (student_id, quiz_id);

CREATE INDEX IF NOT EXISTS idx_assignments_course_due ON public.assignments (course_id, due_date);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_created ON public.quizzes (course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_courses_created ON public.courses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_status_created ON public.courses (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_logs_created ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created ON public.system_logs (level, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments (course_id);

CREATE INDEX IF NOT EXISTS idx_live_classes_start ON public.live_classes (start_at);