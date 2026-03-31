-- Fix: allow accepted team members to read projects they're
-- invited to. Additive policy — owner policy remains unchanged.
-- RLS SELECT policies are OR'd by Postgres automatically.
CREATE POLICY "Team members can read their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM team_members
      WHERE user_id = (select auth.uid())
      AND invite_status = 'accepted'
    )
  );
