CREATE TABLE IF NOT EXISTS public.permit_form_fills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_project_id uuid NOT NULL
    REFERENCES public.homeowner_projects(id) ON DELETE CASCADE,
  form_key text NOT NULL,
  form_name text NOT NULL,
  status text NOT NULL DEFAULT 'needs_review'
    CHECK (status IN ('needs_review', 'approved')),
  filled_fields jsonb NOT NULL DEFAULT '{}',
  flagged_fields jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(homeowner_project_id, form_key)
);

ALTER TABLE public.permit_form_fills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homeowners manage their form fills"
  ON public.permit_form_fills FOR ALL
  USING (
    homeowner_project_id IN (
      SELECT id FROM public.homeowner_projects
      WHERE homeowner_id = auth.uid()
    )
  );
