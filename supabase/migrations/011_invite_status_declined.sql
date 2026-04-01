-- Add 'declined' to invite_status constraint
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_invite_status_check;
ALTER TABLE team_members ADD CONSTRAINT team_members_invite_status_check
  CHECK (invite_status IN ('pending', 'accepted', 'declined'));
