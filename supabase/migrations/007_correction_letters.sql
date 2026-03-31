CREATE TABLE public.correction_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_permit_id uuid REFERENCES project_permits(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes integer,
  uploaded_by uuid REFERENCES auth.users,
  uploaded_at timestamptz DEFAULT now(),
  ai_parsed_issues jsonb,
  ai_summary text,
  ai_parsed_at timestamptz,
  status text CHECK (status IN ('uploaded','parsing','parsed','corrections_applied','resubmitting','resubmitted','failed')) DEFAULT 'uploaded',
  resubmitted_at timestamptz,
  accela_resubmit_record_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.correction_letters ENABLE ROW LEVEL SECURITY;