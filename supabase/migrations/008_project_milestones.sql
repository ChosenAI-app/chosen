CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_project_id uuid REFERENCES homeowner_projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  milestone_order integer NOT NULL,
  amount_cents integer NOT NULL,
  due_date date,
  status text CHECK (status IN ('pending','in_progress','submitted_for_approval','approved','paid','disputed')) DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Homeowners view own milestones" ON project_milestones FOR SELECT USING (homeowner_project_id IN (SELECT id FROM homeowner_projects WHERE homeowner_id = auth.uid()));