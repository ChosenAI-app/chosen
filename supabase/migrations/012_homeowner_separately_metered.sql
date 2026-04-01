ALTER TABLE public.homeowner_projects
  ADD COLUMN IF NOT EXISTS separately_metered boolean DEFAULT false;
