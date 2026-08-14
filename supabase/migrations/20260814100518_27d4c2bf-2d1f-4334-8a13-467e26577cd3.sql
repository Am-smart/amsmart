-- 1. Group assignments
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS assignment_type TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS groups JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.assignments
  ADD CONSTRAINT assignments_assignment_type_check
  CHECK (assignment_type IN ('individual', 'group'));

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS group_id TEXT;

CREATE INDEX IF NOT EXISTS idx_submissions_group ON public.submissions(assignment_id, group_id);

-- 2. Semesters + archiving
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS semester TEXT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_courses_semester ON public.courses(semester);

-- 3. Discussion engagement
ALTER TABLE public.discussions
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 4. Certificate requests
CREATE TABLE IF NOT EXISTS public.certificate_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  decision_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT certificate_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT certificate_requests_unique_open UNIQUE (user_id, course_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificate_requests TO authenticated;
GRANT ALL ON public.certificate_requests TO service_role;

ALTER TABLE public.certificate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own certificate requests"
  ON public.certificate_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Students create own certificate requests"
  ON public.certificate_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Course teachers read certificate requests"
  ON public.certificate_requests FOR SELECT TO authenticated
  USING (public.is_course_teacher(course_id, auth.uid()));

CREATE POLICY "Course teachers review certificate requests"
  ON public.certificate_requests FOR UPDATE TO authenticated
  USING (public.is_course_teacher(course_id, auth.uid()))
  WITH CHECK (public.is_course_teacher(course_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_certificate_requests_user ON public.certificate_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_course ON public.certificate_requests(course_id, status, created_at DESC);

CREATE TRIGGER update_certificate_requests_updated_at
  BEFORE UPDATE ON public.certificate_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Platform settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users read platform settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (true);

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.system_settings (key, value) VALUES
  ('proctoring_control', '{"enabled": true, "strict_mode": false, "snapshot_interval_seconds": 30}'::jsonb),
  ('maintenance_tasks', '{"auto_cleanup": false, "auto_backup": false, "retention_days": 180}'::jsonb)
ON CONFLICT (key) DO NOTHING;