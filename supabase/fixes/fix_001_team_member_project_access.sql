-- Fix: allow accepted team members to read projects they're invited to.
--
-- PROBLEM: A naive policy on `projects` that subqueries `team_members`
-- causes infinite recursion because `team_members` has its own SELECT
-- policy that subqueries `projects`. Postgres evaluates both directions
-- and loops forever.
--
-- SOLUTION: A SECURITY DEFINER function bypasses RLS on team_members,
-- breaking the cycle. The function runs as the definer (superuser),
-- so team_members RLS is not evaluated inside it.

-- Step 1: Drop the broken policy if it was already applied
DROP POLICY IF EXISTS "Team members can read their projects" ON projects;

-- Step 2: Create a security definer function that checks team membership
-- without triggering team_members RLS
CREATE OR REPLACE FUNCTION public.is_project_team_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.project_id = p_project_id
    AND team_members.user_id = (select auth.uid())
    AND team_members.invite_status = 'accepted'
  );
$$;

-- Step 3: Create the policy using the function
CREATE POLICY "Team members can read their projects"
  ON projects FOR SELECT
  TO authenticated
  USING (public.is_project_team_member(id));
