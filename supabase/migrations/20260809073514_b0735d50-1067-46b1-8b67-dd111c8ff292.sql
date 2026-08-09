-- =============================================================
-- Phase 0: schema parity with legacy Smart-main build
-- Convention note: every existing public table in this project has
-- RLS ENABLED with no policies; all access flows through the server
-- service layer using the service role, which performs explicit
-- role/ownership checks. New tables follow that exact convention.
-- =============================================================

-- ---------- topics ----------
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.topics TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS topics_course_id_idx ON public.topics(course_id);
CREATE INDEX IF NOT EXISTS topics_course_order_idx ON public.topics(course_id, order_index);

CREATE TRIGGER topics_set_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- lessons may optionally belong to a topic (nullable = non-breaking)
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS lessons_topic_id_idx ON public.lessons(topic_id);

-- ---------- certificates ----------
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  title TEXT,
  recipient_name TEXT,
  course_title TEXT,
  final_grade NUMERIC(6,2),
  template TEXT NOT NULL DEFAULT 'default',
  pdf_url TEXT,
  issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT certificates_user_course_unique UNIQUE (user_id, course_id)
);

GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS certificates_user_id_idx ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS certificates_course_id_idx ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS certificates_code_idx ON public.certificates(code);

CREATE TRIGGER certificates_set_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- violations (curated proctoring dashboard table) ----------
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT,
  assessment_id UUID,
  assessment_type TEXT NOT NULL DEFAULT 'quiz',
  assessment_title TEXT,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW',
  message TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.violations TO service_role;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS violations_session_idx ON public.violations(session_id);
CREATE INDEX IF NOT EXISTS violations_user_idx ON public.violations(user_id);
CREATE INDEX IF NOT EXISTS violations_assessment_idx ON public.violations(assessment_id);
CREATE INDEX IF NOT EXISTS violations_timestamp_idx ON public.violations(timestamp DESC);
CREATE INDEX IF NOT EXISTS violations_severity_idx ON public.violations(severity);

-- ---------- study_sessions ----------
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  label TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  focus_seconds INTEGER NOT NULL DEFAULT 0,
  idle_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS study_sessions_user_idx ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS study_sessions_course_idx ON public.study_sessions(course_id);
CREATE INDEX IF NOT EXISTS study_sessions_started_idx ON public.study_sessions(started_at DESC);

CREATE TRIGGER study_sessions_set_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- discussion_views ----------
CREATE TABLE IF NOT EXISTS public.discussion_views (
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

GRANT ALL ON public.discussion_views TO service_role;
ALTER TABLE public.discussion_views ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS discussion_views_user_idx ON public.discussion_views(user_id);

-- ---------- live proctoring: active session rollup ----------
CREATE OR REPLACE FUNCTION public.get_active_proctored_sessions()
RETURNS TABLE (
  session_id TEXT,
  user_id UUID,
  user_email TEXT,
  full_name TEXT,
  assessment_id UUID,
  assessment_title TEXT,
  assessment_type TEXT,
  started_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ,
  violation_count BIGINT,
  high_severity_count BIGINT,
  status TEXT,
  is_online BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest AS (
    SELECT
      v.session_id,
      MIN(v.user_id::text) FILTER (WHERE v.user_id IS NOT NULL) AS user_id_txt,
      MIN(v.user_email)                                          AS user_email,
      MIN(v.assessment_id::text) FILTER (WHERE v.assessment_id IS NOT NULL) AS assessment_id_txt,
      MIN(v.assessment_title)                                    AS assessment_title,
      MIN(v.assessment_type)                                     AS assessment_type,
      MIN(v.timestamp)                                           AS first_act,
      MAX(v.timestamp)                                           AS last_act,
      COUNT(*) FILTER (WHERE v.severity <> 'INFO')               AS total_v,
      COUNT(*) FILTER (WHERE v.severity NOT IN ('INFO', 'LOW'))  AS high_v
    FROM public.violations v
    WHERE v.timestamp > now() - INTERVAL '4 hours'
    GROUP BY v.session_id
  )
  SELECT
    l.session_id,
    NULLIF(l.user_id_txt, '')::uuid                AAS_PLACEHOLDER,
    l.user_email,
    u.full_name,
    NULLIF(l.assessment_id_txt, '')::uuid,
    l.assessment_title,
    COALESCE(l.assessment_type, 'quiz'),
    l.first_act,
    l.last_act,
    l.total_v,
    l.high_v,
    CASE
      WHEN l.high_v >= 5 THEN 'flagged'
      WHEN l.high_v > 0  THEN 'warning'
      ELSE 'clean'
    END,
    (l.last_act > now() - INTERVAL '2 minutes')
  FROM latest l
  LEFT JOIN public.users u ON u.id = NULLIF(l.user_id_txt, '')::uuid
  ORDER BY l.last_act DESC;
$$;

REVOKE ALL ON FUNCTION public.get_active_proctored_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_proctored_sessions() TO service_role;