-- Expand team_members.role CHECK constraint to include all 6 roles.
-- Run this in Supabase SQL Editor before testing new roles.

ALTER TABLE team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (role IN (
    'contractor','co_owner','architect',
    'engineer','inspector','client'
  ));
