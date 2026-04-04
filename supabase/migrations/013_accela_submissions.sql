-- Tracks each Accela submission attempt
CREATE TABLE IF NOT EXISTS public.accela_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_project_id uuid NOT NULL REFERENCES public.homeowner_projects(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'draft_created', 'forms_filled', 'documents_uploaded',
      'submitted', 'in_review', 'corrections_required',
      'approved', 'rejected', 'error'
    )),

  accela_record_id text,
  accela_custom_id text,
  accela_tracking_id text,

  certified_by_user_id uuid REFERENCES auth.users(id),
  certified_at timestamptz,
  certification_ip_address text,
  certification_user_agent text,
  certification_text text,

  submitted_at timestamptz,
  last_status_check timestamptz,
  next_status_check timestamptz,

  last_error text,
  retry_count integer DEFAULT 0,
  raw_accela_response jsonb,
  estimated_fees jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.homeowner_projects
  ADD COLUMN IF NOT EXISTS accela_submission_id uuid,
  ADD COLUMN IF NOT EXISTS accela_record_number text;

ALTER TABLE public.accela_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homeowners can view their own submissions"
  ON public.accela_submissions FOR SELECT
  USING (
    homeowner_project_id IN (
      SELECT id FROM public.homeowner_projects WHERE homeowner_id = auth.uid()
    )
  );
