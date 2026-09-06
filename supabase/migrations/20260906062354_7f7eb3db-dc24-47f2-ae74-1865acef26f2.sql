ALTER TABLE public.certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;
ALTER TABLE public.certificate_requests ADD CONSTRAINT certificate_requests_status_check CHECK (status = ANY (ARRAY['pending'::text, 'teacher_approved'::text, 'approved'::text, 'rejected'::text]));
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS teacher_reviewed_by uuid;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS teacher_reviewed_at timestamptz;
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS teacher_note text;