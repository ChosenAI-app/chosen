CREATE TABLE public.bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_project_id uuid REFERENCES homeowner_projects(id) ON DELETE CASCADE NOT NULL,
  bidder_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  bidder_role text CHECK (bidder_role IN ('contractor','architect','engineer')) NOT NULL,
  quote_amount integer NOT NULL,
  quote_currency text DEFAULT 'USD',
  timeline_weeks integer,
  cover_letter text,
  status text CHECK (status IN ('pending','shortlisted','accepted','rejected','withdrawn')) DEFAULT 'pending',
  submitted_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bidders view own bids" ON bids FOR SELECT USING (auth.uid() = bidder_id);
CREATE POLICY "Homeowners view bids on their projects" ON bids FOR SELECT USING (homeowner_project_id IN (SELECT id FROM homeowner_projects WHERE homeowner_id = auth.uid()));
CREATE POLICY "Authenticated users insert bids" ON bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);
CREATE POLICY "Bidders update own pending bids" ON bids FOR UPDATE USING (auth.uid() = bidder_id AND status = 'pending');
CREATE POLICY "Homeowners update bid status" ON bids FOR UPDATE USING (homeowner_project_id IN (SELECT id FROM homeowner_projects WHERE homeowner_id = auth.uid()));