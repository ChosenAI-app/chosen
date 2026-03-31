@AGENTS.md

# Chosen — Complete Agent Context

## What We Are Building
Chosen is a permit workflow and project management platform for residential construction contractors in California. The core product: a contractor enters a property address and project scope, and Chosen generates their complete permit workflow — which permits are required, what documents to gather, the inspection sequence, fees, and timeline — all pre-loaded for their jurisdiction. Contractors track every step, collaborate with their team, and manage documents inside Chosen without ever needing to navigate city websites.

MVP is Palo Alto, California only. One city. Done right.

## Team
- Shawnak Shivakumar — shawnak.shivakumar@gmail.com — GitHub: Java4Jedi
- Axel Pilette — GitHub: Axel-Pilette
- GitHub org: https://github.com/ChosenAI-app
- Repo: https://github.com/ChosenAI-app/chosen
- Vercel: https://vercel.com/shawnaks-projects/chosen
- Supabase project ID: olrdvtdagkghjatbbajl
- Supabase URL: https://olrdvtdagkghjatbbajl.supabase.co

## Tech Stack
| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | TypeScript strict. Always read node_modules/next/dist/docs/ before writing Next.js code per AGENTS.md |
| Styling | Tailwind CSS v4 | v4 syntax — no tailwind.config.js, uses CSS @theme variables |
| Components | shadcn/ui (Nova preset, Radix) | Components live in /src/components/ui — never edit these directly |
| Database | Supabase (Postgres) | Project ID: olrdvtdagkghjatbbajl |
| Auth | Supabase Auth | Cookie-based via @supabase/ssr |
| File Storage | Supabase Storage | Bucket: project-documents |
| Hosting | Vercel | Auto-deploys on push to main |
| Package manager | npm | |

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://olrdvtdagkghjatbbajl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[see .env.local — never hardcode]
```

## Project File Structure
```
chosen/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/              # Protected route group
│   │   │   ├── layout.tsx            # Auth guard here
│   │   │   ├── dashboard/page.tsx    # Project list
│   │   │   └── projects/
│   │   │       ├── new/page.tsx      # Create project
│   │   │       └── [id]/
│   │   │           ├── page.tsx      # Project overview
│   │   │           ├── permits/page.tsx
│   │   │           ├── documents/page.tsx
│   │   │           ├── inspections/page.tsx
│   │   │           └── team/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Landing / redirect
│   ├── components/
│   │   ├── ui/                       # shadcn/ui — DO NOT EDIT
│   │   ├── auth/                     # Auth-specific components
│   │   ├── projects/                 # Project-related components
│   │   ├── permits/                  # Permit workflow components
│   │   └── shared/                   # Shared layout components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts             # createServerClient for Server Components + Actions
│   │   │   ├── client.ts             # createBrowserClient for Client Components
│   │   │   └── middleware.ts         # Session refresh middleware
│   │   ├── actions/                  # Server Actions (all mutations go here)
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── permits.ts
│   │   │   ├── documents.ts
│   │   │   └── team.ts
│   │   ├── types/
│   │   │   └── index.ts              # All TypeScript types/interfaces
│   │   └── utils/
│   │       └── jurisdiction.ts       # Zip code → jurisdiction logic
│   └── middleware.ts                 # Supabase session middleware (root level)
├── supabase/
│   └── schema.sql                    # Full DB schema + seed data
├── public/
├── CLAUDE.md                         # This file
├── AGENTS.md                         # Next.js agent rules (auto-generated)
├── .env.local                        # Never commit this
└── package.json
```

## MVP Features — Build In This Exact Order

### 1. Supabase Client Setup
Create server.ts, client.ts, and middleware.ts in /src/lib/supabase/ using @supabase/ssr. Create /src/middleware.ts to refresh sessions on every request.

### 2. Authentication
- /app/(auth)/login — email + password login form
- /app/(auth)/signup — name + email + password signup
- Redirect to /dashboard after login
- (dashboard) layout.tsx checks auth, redirects to /login if not authenticated
- Use Supabase Auth — no third-party auth libraries

### 3. Project Creation
- /app/(dashboard)/projects/new — multi-field form
- Fields: street address, city (pre-filled "Palo Alto"), zip code (validated against Palo Alto zips), project type (dropdown), scope description (textarea)
- On submit: detect jurisdiction from zip, generate project_permits rows for that project type, redirect to project detail page

### 4. Jurisdiction Detection
- File: /src/lib/utils/jurisdiction.ts
- Palo Alto zip codes: 94301, 94302, 94303, 94304, 94305, 94306
- Function: getJurisdictionByZip(zip: string) → jurisdiction row or null
- If no match: show error "Chosen currently supports Palo Alto only"

### 5. Permit Workflow Generation
- When a project is created, query permit_types for that jurisdiction where required_for contains the project_type
- Create one project_permits row per applicable permit_type with status 'not_started'
- This is the core engine — hardcoded Palo Alto rules in the DB, not in code

### 6. Project Dashboard
- /app/(dashboard)/dashboard — list all projects for current user
- Each project card shows: address, project type, number of permits, overall status
- Link to project detail

### 7. Project Detail — Permits Tab
- List of all permits for this project
- Each permit shows: name, status badge, document checklist progress (X/Y docs uploaded)
- Contractor can update status via dropdown

### 8. Project Detail — Documents Tab
- Document checklist grouped by permit
- Each item: document name, required/optional badge, upload status
- File upload: Supabase Storage → project-documents bucket → path: {project_id}/{permit_id}/{filename}
- Show uploaded file name + download link once uploaded

### 9. Project Detail — Inspections Tab
- List of inspection steps in order for this project type
- Each step shows: name, description, prerequisites (which prior inspections must pass first)
- Status: not_started, scheduled, passed, failed
- Prerequisites shown as linked badges

### 10. Project Detail — Team Tab
- List current team members with role badges
- "Invite" button → modal with email input + role dropdown (architect, client)
- Saves to team_members table with invite_status: pending
- (Actual email sending is out of scope for MVP — just save the record)

## Database Schema

### jurisdictions
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name text NOT NULL
city text NOT NULL
state text NOT NULL DEFAULT 'CA'
zip_codes text[] NOT NULL
created_at timestamptz NOT NULL DEFAULT now()
```

### projects
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
address text NOT NULL
city text NOT NULL
zip_code text NOT NULL
project_type text NOT NULL CHECK (project_type IN ('adu_detached','adu_attached','addition','remodel'))
scope_description text
jurisdiction_id uuid NOT NULL REFERENCES jurisdictions(id)
created_at timestamptz NOT NULL DEFAULT now()
```

### permit_types
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
jurisdiction_id uuid NOT NULL REFERENCES jurisdictions(id)
name text NOT NULL
description text
display_order int NOT NULL DEFAULT 0
required_for text[] NOT NULL DEFAULT '{}'
```
Note: required_for is an array of project_type values this permit applies to. E.g. `'{adu_detached,adu_attached}'`

### permit_requirements
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
permit_type_id uuid NOT NULL REFERENCES permit_types(id)
document_name text NOT NULL
description text
required boolean NOT NULL DEFAULT true
display_order int NOT NULL DEFAULT 0
```

### inspection_steps
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
permit_type_id uuid NOT NULL REFERENCES permit_types(id)
name text NOT NULL
description text
display_order int NOT NULL
prerequisite_ids uuid[] NOT NULL DEFAULT '{}'
```

### project_permits
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
permit_type_id uuid NOT NULL REFERENCES permit_types(id)
status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','submitted','in_review','corrections','approved','issued'))
submitted_at timestamptz
notes text
created_at timestamptz NOT NULL DEFAULT now()
```

### project_documents
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
permit_requirement_id uuid NOT NULL REFERENCES permit_requirements(id)
file_name text NOT NULL
file_url text NOT NULL
uploaded_by uuid NOT NULL REFERENCES auth.users(id)
uploaded_at timestamptz NOT NULL DEFAULT now()
status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','approved','rejected'))
```

### team_members
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id uuid REFERENCES auth.users(id)
role text NOT NULL CHECK (role IN ('contractor','architect','client'))
invited_email text NOT NULL
invite_status text NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending','accepted'))
invited_at timestamptz NOT NULL DEFAULT now()
```

## Row Level Security Rules

Every table has RLS enabled. The core policies:

**projects** — user can SELECT/INSERT/UPDATE/DELETE their own rows where user_id = auth.uid()

**project_permits, project_documents, team_members** — user can access rows where the parent project's user_id = auth.uid() OR auth.uid() exists in team_members for that project_id

**jurisdictions, permit_types, permit_requirements, inspection_steps** — public read (SELECT) for all authenticated users, no write access from client

## Code Style Rules

### Components
- Server Components by default — no "use client" unless you need onClick, useState, useEffect, or browser APIs
- When in doubt: Server Component
- Never put data fetching in Client Components — fetch in Server Component, pass as props

### Data Mutations
- ALL mutations go through Server Actions in /src/lib/actions/
- Never use API routes (route.ts) for CRUD operations
- Server Actions use the server Supabase client

### TypeScript
- Strict mode — zero `any` types
- Define all DB row types in /src/lib/types/index.ts
- Use type inference from Supabase generated types where possible

### Supabase Clients
```typescript
// In Server Components, layouts, Server Actions:
import { createServerClient } from '@supabase/ssr'

// In Client Components only:
import { createBrowserClient } from '@supabase/ssr'
```

### Error Handling
- Server Actions return { data, error } objects — never throw
- Show user-facing errors with shadcn/ui toast or inline error messages
- Log errors to console in development

## Design System

### Principles
- Professional and trustworthy — contractors are betting their livelihoods on this tool
- No purple gradients, no card-in-card nesting, no generic AI aesthetic
- Information density: contractors want to see status at a glance, not buried in tabs
- Mobile-aware but not mobile-first for MVP (contractors often use tablets/laptops on site)

### Components Available (shadcn/ui Nova preset)
Button, Card, Input, Label, Form, Table, Badge, Select, Textarea — all in /src/components/ui/

### Status Colors (use Badge component)
- not_started → gray
- submitted → blue
- in_review → yellow
- corrections → orange
- approved → green
- issued → emerald
- passed → green
- failed → red
- pending → yellow
- uploaded → blue

### Skills Available
Impeccable design skills are installed globally. After building any full page, run:
- /audit — find design issues
- /polish — clean up inconsistencies
- /normalize — align with design system

## Palo Alto Permit Rules (Seed Data)

### Jurisdiction
City of Palo Alto, Santa Clara County, California
Zip codes served: 94301, 94303, 94304, 94306
Note: 94305 is Stanford (unincorporated Santa Clara County) — NOT City of Palo Alto
Portal: aca-prod.accela.com/PALOALTO
Development Center: 285 Hamilton Ave, Palo Alto CA 94301

### Detached ADU (adu_detached) — Permit Types
1. Building Permit (required)
2. Electrical Permit (required)
3. Plumbing Permit (required)
4. Mechanical Permit (required)
5. Palo Alto Fire Department Review (conditional — required if ADU is west of Hwy 280, main house has sprinklers, or ADU is 150+ ft from street)

### Attached ADU / JADU (adu_attached) — Permit Types
1. Building Permit (required)
2. Electrical Permit (required)
3. Plumbing Permit (if new plumbing added)
4. Mechanical Permit (if HVAC modified)
5. JADU Deed Restriction Recording (required before building permit issuance — owner must record with Santa Clara County Clerk-Recorder stating JADU cannot be sold separately and owner will occupy primary or JADU)

### Residential Addition (addition) — Permit Types
1. Building Permit (required)
2. Electrical Permit (required)
3. Plumbing Permit (if plumbing affected)
4. Mechanical Permit (if HVAC affected)
5. Palo Alto Fire Department Review (conditional — triggered if addition causes total floor area to exceed 3,600 SF, or removes/replaces 50%+ of roof or exterior walls, or addition is 50%+ of existing floor area)

### ADU Size Limits (Detached)
- State standard minimum: 800 SF max
- Palo Alto city standard: 900 SF (1 bedroom) or 1,000 SF (2+ bedrooms)
- Units using city standard must comply with Additional City Standards (window placement, privacy screening, orientation)
- Height: 16 ft max (18 ft if within ½ mile of major transit stop)

### Document Requirements — Building Permit (ADU/Addition)
- Site plan showing property lines, existing structures, proposed ADU location, setbacks
- Floor plans (existing and proposed) at minimum 1/4" = 1' scale
- Elevations (all four sides)
- Building sections
- Structural calculations stamped by California-licensed structural engineer
- Title 24 energy compliance documentation (HERS report for new construction)
- Grading/drainage plan (if earthwork involved)
- Soils/geotechnical report (if required by building dept based on site conditions)
- CalGreen checklist

### Fee Overview
- Building Permit Fees: $2,000–$8,000 (based on 1.76% of construction value)
- School Fees (PAUSD): $4.79/SF on all new habitable SF — exempt for ADUs under 500 SF, exempt for JADUs entirely
- Development Impact Fees: $10,000–$80,000 (exempt for ADUs under 750 SF)
- Utility connection fees: varies, contact Palo Alto Utilities

### Inspection Sequence — Detached ADU
1. Foundation/Footing inspection (before concrete pour)
2. Underground Plumbing (before backfill)
3. Underground Electrical Conduit (before backfill)
4. Framing (after framing complete, before insulation)
5. Rough Electrical (after framing, before drywall)
6. Rough Plumbing (after framing, before drywall)
7. Rough Mechanical/HVAC (after framing, before drywall)
8. Insulation (after all rough inspections pass)
9. Drywall Nailing (if required by inspector)
10. Final Electrical
11. Final Plumbing
12. Final Mechanical
13. Final Building
14. Fire Final (if fire review was required — scheduled through Palo Alto Fire Prevention Bureau)
15. Certificate of Occupancy (issued after all finals pass — required before occupancy of detached ADU)