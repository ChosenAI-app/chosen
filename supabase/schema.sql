-- =============================================================================
-- Chosen MVP — Complete Supabase Schema
-- City of Palo Alto permit workflow platform
-- =============================================================================

-- =============================================================================
-- TABLES
-- =============================================================================

-- 1. jurisdictions — reference table for supported cities
create table jurisdictions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  state text not null default 'CA',
  zip_codes text[] not null,
  created_at timestamptz not null default now()
);

-- 2. projects — contractor projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  city text not null,
  zip_code text not null,
  project_type text not null check (project_type in ('adu_detached','adu_attached','addition','remodel')),
  scope_description text,
  jurisdiction_id uuid not null references jurisdictions(id),
  created_at timestamptz not null default now()
);

-- 3. permit_types — which permits exist per jurisdiction
create table permit_types (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references jurisdictions(id),
  name text not null,
  description text,
  display_order int not null default 0,
  required_for text[] not null default '{}'
);

-- 4. permit_requirements — documents needed per permit type
create table permit_requirements (
  id uuid primary key default gen_random_uuid(),
  permit_type_id uuid not null references permit_types(id),
  document_name text not null,
  description text,
  required boolean not null default true,
  display_order int not null default 0
);

-- 5. inspection_steps — ordered inspection sequence per permit type
create table inspection_steps (
  id uuid primary key default gen_random_uuid(),
  permit_type_id uuid not null references permit_types(id),
  name text not null,
  description text,
  display_order int not null,
  prerequisite_ids uuid[] not null default '{}'
);

-- 6. project_permits — permits assigned to a specific project
create table project_permits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  permit_type_id uuid not null references permit_types(id),
  status text not null default 'not_started' check (status in ('not_started','submitted','in_review','corrections','approved','issued')),
  submitted_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- 7. project_documents — uploaded documents for permit requirements
create table project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  permit_requirement_id uuid not null references permit_requirements(id),
  file_name text not null,
  file_url text not null,
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  status text not null default 'uploaded' check (status in ('uploaded','approved','rejected'))
);

-- 8. team_members — project collaborators
create table team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text not null check (role in ('contractor','architect','client')),
  invited_email text not null,
  invite_status text not null default 'pending' check (invite_status in ('pending','accepted')),
  invited_at timestamptz not null default now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

create index idx_projects_user_id on projects(user_id);
create index idx_projects_zip_code on projects(zip_code);
create index idx_projects_jurisdiction_id on projects(jurisdiction_id);
create index idx_permit_types_jurisdiction_id on permit_types(jurisdiction_id);
create index idx_permit_requirements_permit_type_id on permit_requirements(permit_type_id);
create index idx_inspection_steps_permit_type_id on inspection_steps(permit_type_id);
create index idx_project_permits_project_id on project_permits(project_id);
create index idx_project_permits_permit_type_id on project_permits(permit_type_id);
create index idx_project_documents_project_id on project_documents(project_id);
create index idx_project_documents_permit_requirement_id on project_documents(permit_requirement_id);
create index idx_project_documents_uploaded_by on project_documents(uploaded_by);
create index idx_team_members_project_id on team_members(project_id);
create index idx_team_members_user_id on team_members(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
alter table jurisdictions enable row level security;
alter table projects enable row level security;
alter table permit_types enable row level security;
alter table permit_requirements enable row level security;
alter table inspection_steps enable row level security;
alter table project_permits enable row level security;
alter table project_documents enable row level security;
alter table team_members enable row level security;

-- ---------------------------------------------------------------------------
-- jurisdictions — read-only for all authenticated users
-- ---------------------------------------------------------------------------
create policy "Authenticated users can read jurisdictions"
  on jurisdictions for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- permit_types — read-only for all authenticated users
-- ---------------------------------------------------------------------------
create policy "Authenticated users can read permit_types"
  on permit_types for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- permit_requirements — read-only for all authenticated users
-- ---------------------------------------------------------------------------
create policy "Authenticated users can read permit_requirements"
  on permit_requirements for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- inspection_steps — read-only for all authenticated users
-- ---------------------------------------------------------------------------
create policy "Authenticated users can read inspection_steps"
  on inspection_steps for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- projects — owner full CRUD
-- ---------------------------------------------------------------------------
create policy "Owner can select own projects"
  on projects for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owner can insert own projects"
  on projects for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owner can update own projects"
  on projects for update
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owner can delete own projects"
  on projects for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- project_permits — owner OR team member
-- ---------------------------------------------------------------------------
create policy "Owner or team member can select project_permits"
  on project_permits for select
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

create policy "Owner or team member can insert project_permits"
  on project_permits for insert
  to authenticated
  with check (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

create policy "Owner or team member can update project_permits"
  on project_permits for update
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

create policy "Owner or team member can delete project_permits"
  on project_permits for delete
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- project_documents — owner OR team member
-- ---------------------------------------------------------------------------
create policy "Owner or team member can select project_documents"
  on project_documents for select
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

create policy "Owner or team member can insert project_documents"
  on project_documents for insert
  to authenticated
  with check (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

create policy "Owner or team member can update project_documents"
  on project_documents for update
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

create policy "Owner or team member can delete project_documents"
  on project_documents for delete
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
    or
    project_id in (
      select project_id from team_members where user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- team_members — project owner only (no self-reference to avoid recursion)
-- ---------------------------------------------------------------------------
create policy "Project owner can select team_members"
  on team_members for select
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
  );

create policy "Project owner can insert team_members"
  on team_members for insert
  to authenticated
  with check (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
  );

create policy "Project owner can update team_members"
  on team_members for update
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
  );

create policy "Project owner can delete team_members"
  on team_members for delete
  to authenticated
  using (
    project_id in (
      select id from projects where user_id = (select auth.uid())
    )
  );

create policy "Team member can view own membership"
  on team_members for select
  to authenticated
  using (user_id = (select auth.uid()));
  
-- =============================================================================
-- SEED DATA
-- =============================================================================

insert into jurisdictions (name, city, state, zip_codes)
values (
  'City of Palo Alto',
  'Palo Alto',
  'CA',
  ARRAY['94301','94303','94304','94306']
);

-- =============================================================================
-- STORAGE
-- =============================================================================
-- Create bucket 'project-documents' manually in Supabase dashboard with
-- authenticated users INSERT policy.
-- Path convention: {project_id}/{permit_id}/{filename}
