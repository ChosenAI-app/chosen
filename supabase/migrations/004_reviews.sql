CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_project_id uuid REFERENCES homeowner_projects(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users ON DELETE CASCADE,
  reviewee_id uuid REFERENCES auth.users ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviewers insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);