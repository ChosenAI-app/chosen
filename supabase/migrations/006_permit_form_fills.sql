CREATE TABLE public.permit_form_fills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_permit_id uuid REFERENCES project_permits(id) ON DELETE CASCADE UNIQUE,
  ai_filled_fields jsonb DEFAULT '{}',
  human_required_fields jsonb DEFAULT '[]',
  human_answers jsonb DEFAULT '{}',
  status text CHECK (status IN ('not_started','ai_filling','awaiting_human_input','ready_for_review','approved','submitted')) DEFAULT 'not_started',
  assembled_pdf_path text,
  assembled_at timestamptz,
  accela_record_id text,
  accela_status text,
  accela_submitted_at timestamptz,
  last_accela_check timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.permit_form_fills ENABLE ROW LEVEL SECURITY;