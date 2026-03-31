<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CHOSEN — Complete Agent Context & Full Build Plan

## MISSION

Chosen is the end-to-end operating system for residential construction, starting in Palo Alto, California. A homeowner types their address, sees their property in photorealistic 3D, gets an AI-generated project scope in 60 seconds, posts to a marketplace where verified contractors bid, watches AI fill every permit application automatically, submits to the city with one click, processes correction letters automatically, tracks inspections, and releases milestone payments at each step.

**Website:** chosenai.com
**Competitive position:** PermitFlow ($90M raised) does B2B permit prep only. Cottage (defunct) did homeowner ADU matching. Nobody connects homeowner discovery → contractor marketplace → AI permit form-fill → auto-submit → correction letter AI → inspection tracking → milestone payments in one platform. That gap is Chosen.

---

## TEAM

| Person | Email | GitHub |
|--------|-------|--------|
| Shawnak Shivakumar | shawnak.shivakumar@gmail.com | Java4Jedi |
| Axel Pilette | piletteaxel@gmail.com | Axel-Pilette |

- **GitHub org:** https://github.com/ChosenAI-app
- **Repo:** https://github.com/ChosenAI-app/chosen
- **Vercel:** https://vercel.com/shawnaks-projects/chosen
- **Supabase project ID:** olrdvtdagkghjatbbajl
- **Supabase URL:** https://olrdvtdagkghjatbbajl.supabase.co

---

## TECH STACK

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 App Router | TypeScript strict. ALWAYS read `node_modules/next/dist/docs/` before writing any Next.js code |
| Styling | Tailwind CSS v4 | CSS `@theme` variables only — NO `tailwind.config.js` |
| Components | shadcn/ui Nova preset | `/src/components/ui/` — NEVER edit directly |
| Database | Supabase Postgres | olrdvtdagkghjatbbajl |
| Auth | Supabase Auth | Cookie-based via `@supabase/ssr` |
| Storage | Supabase Storage | Bucket: `project-documents` |
| AI Chat | Vercel AI SDK v6 | `ai` + `@ai-sdk/anthropic` — useChat hook for streaming |
| AI Model | Claude Sonnet 4.6 | Model string: `claude-sonnet-4-6` — use for ALL AI operations |
| 3D Maps | Google Maps 3D + CesiumJS | Photorealistic 3D Tiles API — load CesiumJS from CDN, NOT npm |
| Parcel Data | Regrid API | Server-only — never expose `REGRID_API_KEY` to client |
| Email | Resend | Sending domain: chosenai.com — verified |
| Payments | Stripe Connect | Marketplace model, Express accounts, destination charges |
| Hosting | Vercel | Auto-deploys on push to `main` |
| Fonts | Geist | Via `next/font/local` — already configured in root layout |
| Package Manager | npm | |

---

## ENVIRONMENT VARIABLES

All of these exist in `.env.local` and Vercel. Never hardcode any value.
```
# Supabase (already working)
NEXT_PUBLIC_SUPABASE_URL=https://olrdvtdagkghjatbbajl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[.env.local]
SUPABASE_SERVICE_ROLE_KEY=[.env.local — server only, never NEXT_PUBLIC_]

# AI — separate billing from Max plan, pay-per-token (~$3/M input, $15/M output for Sonnet 4.6)
ANTHROPIC_API_KEY=[server only]

# Maps — browser-safe, restricted to chosenai.com and localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=[browser-safe]

# Parcel Data — server only
REGRID_API_KEY=[server only]

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[browser-safe]
STRIPE_SECRET_KEY=[server only]
STRIPE_WEBHOOK_SECRET=[server only — generate: stripe listen --forward-to localhost:3000/api/stripe/webhook]

# Email
RESEND_API_KEY=[server only]
```

**Security rules — absolute, never violate:**
- `NEXT_PUBLIC_` prefix = safe for browser bundle
- All others = server actions and API route handlers ONLY
- Never import `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `REGRID_API_KEY`, or `RESEND_API_KEY` in any file with `'use client'` or any file under `/src/app/api/` that could be called from the client without auth

---

## WHAT IS ALREADY BUILT — DO NOT REBUILD ANY OF THIS

The contractor dashboard is complete and production-ready. All of the following work correctly:

**Authentication:** Signup, login, logout via Supabase Auth. Cookie-based sessions. Middleware session refresh. Split login/signup layout with branding panel.

**Contractor Dashboard:** Project list with stats row (total projects, permits in progress, docs uploaded). Owned + invited projects. Permit progress bars. "Invited" badge. Relative timestamps.

**Project Creation:** 2-step form. Google Places-style address entry. Palo Alto zip validation (94301, 94303, 94304, 94306). Project type selection. Conditional permit intake questionnaire (fire west of 280, sprinklers, earthwork). Scope description.

**Permit Workflow Engine:** Conditional permit generation based on intake answers. Correct Palo Alto rules seeded in DB. All permit types and requirements in DB.

**Project Detail Page:** 2-column layout (permits left, metadata + team right). Role-gated `PermitStatusSelect` with `useOptimistic`. Inspection link. Team management. Delete project with AlertDialog confirm.

**Documents:** Upload to Supabase Storage (`project-documents` bucket). Checklist by permit type. Role-gated upload/delete. Status badges.

**Inspections:** 15-step vertical timeline for detached ADU. Certificate of Occupancy green treatment. `maybeSingle()` pattern for projects with no Building Permit.

**Team:** 6-role system (contractor, co_owner, architect, engineer, inspector, client). Invite by email using admin client for lookup. Remove member. RLS via `SECURITY DEFINER` function `public.is_project_team_member()` to prevent recursion.

**Permissions System:** `/src/lib/utils/permissions.ts` — `getUserRole()`, `canManageTeam()`, `canDeleteProject()`, `canUploadDocuments()`, `canDeleteDocuments()`, `canUpdatePermitStatus()`, `canViewInspections()`, `canViewDocuments()`, `canViewTeam()`. This is the single source of truth for all authorization. Every page and server action that touches project data calls `getUserRole()` — no direct `project.user_id === user.id` checks outside this function.

**UI Design System:** Industrial Precision dark theme. Deep slate background (#0f1117), warm amber accent, Geist font, `StatusBadge` stamp components, 2-column project detail layout, vertical timeline inspections, split auth layout.

**RLS Fixes Applied (all in supabase/fixes/):**
- `fix_001_team_member_project_access.sql` — additive SELECT policy on projects
- `fix_002_team_member_rls_security_definer.sql` — SECURITY DEFINER function to break RLS recursion
- `fix_003_expand_roles.sql` — expanded role CHECK constraint to 6 roles

**Team member role constraint (currently in DB):**
```sql
CHECK (role IN ('contractor','co_owner','architect','engineer','inspector','client'))
```

---

## COMPLETE DATABASE SCHEMA — ALL 16 TABLES

### Original 8 Tables (already in schema.sql, seeded, working)

**jurisdictions**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name text NOT NULL
city text NOT NULL
state text NOT NULL DEFAULT 'CA'
zip_codes text[] NOT NULL
created_at timestamptz NOT NULL DEFAULT now()
```

**projects** (contractor-side projects)
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

**permit_types**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
jurisdiction_id uuid NOT NULL REFERENCES jurisdictions(id)
name text NOT NULL
description text
display_order int NOT NULL DEFAULT 0
required_for text[] NOT NULL DEFAULT '{}'
```

**permit_requirements**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
permit_type_id uuid NOT NULL REFERENCES permit_types(id)
document_name text NOT NULL
description text
required boolean NOT NULL DEFAULT true
display_order int NOT NULL DEFAULT 0
```

**inspection_steps**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
permit_type_id uuid NOT NULL REFERENCES permit_types(id)
name text NOT NULL
description text
display_order int NOT NULL
prerequisite_ids uuid[] NOT NULL DEFAULT '{}'
```

**project_permits**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
permit_type_id uuid NOT NULL REFERENCES permit_types(id)
status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','submitted','in_review','corrections','approved','issued'))
submitted_at timestamptz
notes text
created_at timestamptz NOT NULL DEFAULT now()
```

**project_documents**
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

**team_members**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE
user_id uuid REFERENCES auth.users(id)
role text NOT NULL CHECK (role IN ('contractor','co_owner','architect','engineer','inspector','client'))
invited_email text NOT NULL
invite_status text NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending','accepted'))
invited_at timestamptz NOT NULL DEFAULT now()
```

### New 8 Tables (already migrated via 001–008 in supabase/migrations/)

**profiles** (auto-created for every signup via trigger `on_auth_user_created`)
```sql
id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE
full_name text
avatar_url text
user_type text CHECK (user_type IN ('homeowner','contractor','architect','engineer','inspector')) DEFAULT 'homeowner'
phone text
company_name text
license_number text
license_state text DEFAULT 'CA'
bio text
website_url text
service_areas text[]
avg_rating numeric(3,2)
total_reviews integer DEFAULT 0
stripe_customer_id text
stripe_account_id text
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

**homeowner_projects** (homeowner-side project object, separate from contractor `projects`)
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
homeowner_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL
address text NOT NULL
zip_code text NOT NULL
jurisdiction_id uuid REFERENCES jurisdictions(id)
project_type text NOT NULL CHECK (project_type IN ('adu_detached','adu_attached','jadu','addition','remodel','new_construction','conversion'))
description text
ai_scope_summary text
ai_permit_checklist jsonb        -- [{name, description, required}]
ai_cost_estimate_low integer     -- dollars
ai_cost_estimate_high integer
ai_timeline_weeks_low integer
ai_timeline_weeks_high integer
ai_feasibility_notes text
ai_generated_at timestamptz
regrid_parcel_id text
lot_size_sqft integer
existing_sqft integer
year_built integer
zoning text
zoning_description text
parcel_geometry jsonb            -- GeoJSON polygon for lot boundary overlay in CesiumJS
fire_west_of_280 boolean DEFAULT false
fire_sprinklers_exist boolean DEFAULT false
has_earthwork boolean DEFAULT false
status text CHECK (status IN ('draft','ai_processing','scope_ready','posted_to_marketplace','contractor_selected','permit_in_progress','permitted','construction','complete','cancelled')) DEFAULT 'draft'
map_lat numeric(10,7)
map_lng numeric(10,7)
map_heading numeric(6,2) DEFAULT 0
map_tilt numeric(5,2) DEFAULT 60
map_altitude numeric(8,2) DEFAULT 150
contractor_project_id uuid REFERENCES projects(id)
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

**bids**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
homeowner_project_id uuid REFERENCES homeowner_projects(id) ON DELETE CASCADE NOT NULL
bidder_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL
bidder_role text CHECK (bidder_role IN ('contractor','architect','engineer')) NOT NULL
quote_amount integer NOT NULL    -- dollars
quote_currency text DEFAULT 'USD'
timeline_weeks integer
cover_letter text
status text CHECK (status IN ('pending','shortlisted','accepted','rejected','withdrawn')) DEFAULT 'pending'
submitted_at timestamptz DEFAULT now()
responded_at timestamptz
created_at timestamptz DEFAULT now()
```

**reviews**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
homeowner_project_id uuid REFERENCES homeowner_projects(id) ON DELETE CASCADE
reviewer_id uuid REFERENCES auth.users ON DELETE CASCADE
reviewee_id uuid REFERENCES auth.users ON DELETE CASCADE
rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL
comment text
created_at timestamptz DEFAULT now()
```

**ai_conversations**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
homeowner_project_id uuid REFERENCES homeowner_projects(id) ON DELETE CASCADE
user_id uuid REFERENCES auth.users ON DELETE CASCADE
messages jsonb NOT NULL DEFAULT '[]'   -- Vercel AI SDK message array format
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

**permit_form_fills**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_permit_id uuid REFERENCES project_permits(id) ON DELETE CASCADE UNIQUE
ai_filled_fields jsonb DEFAULT '{}'
human_required_fields jsonb DEFAULT '[]'   -- [{field_name, label, type, hint}]
human_answers jsonb DEFAULT '{}'
status text CHECK (status IN ('not_started','ai_filling','awaiting_human_input','ready_for_review','approved','submitted')) DEFAULT 'not_started'
assembled_pdf_path text
assembled_at timestamptz
accela_record_id text
accela_status text
accela_submitted_at timestamptz
last_accela_check timestamptz
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

**correction_letters**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
project_permit_id uuid REFERENCES project_permits(id) ON DELETE CASCADE NOT NULL
file_url text NOT NULL
file_name text NOT NULL
file_size_bytes integer
uploaded_by uuid REFERENCES auth.users
uploaded_at timestamptz DEFAULT now()
ai_parsed_issues jsonb    -- [{issue, affected_field, suggested_fix, is_blocking}]
ai_summary text
ai_parsed_at timestamptz
status text CHECK (status IN ('uploaded','parsing','parsed','corrections_applied','resubmitting','resubmitted','failed')) DEFAULT 'uploaded'
resubmitted_at timestamptz
accela_resubmit_record_id text
created_at timestamptz DEFAULT now()
```

**project_milestones**
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
homeowner_project_id uuid REFERENCES homeowner_projects(id) ON DELETE CASCADE NOT NULL
name text NOT NULL
description text
milestone_order integer NOT NULL
amount_cents integer NOT NULL
due_date date
status text CHECK (status IN ('pending','in_progress','submitted_for_approval','approved','paid','disputed')) DEFAULT 'pending'
stripe_payment_intent_id text
stripe_transfer_id text
paid_at timestamptz
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

---

## ROW LEVEL SECURITY

All tables have RLS enabled. Key patterns:

**projects:** `USING (user_id = auth.uid())` for owner access + additive policy via `is_project_team_member()` for team members.

**project_permits, project_documents, team_members:** Access via parent project ownership OR team membership.

**homeowner_projects:** Homeowners manage own rows. Contractors can SELECT where `status = 'posted_to_marketplace'`.

**bids:** Bidders see own bids. Homeowners see bids on their projects.

**profiles:** Public SELECT. Users UPDATE own row only.

**jurisdictions, permit_types, permit_requirements, inspection_steps:** Public read for all authenticated users. No client writes.

**SECURITY DEFINER function (already in DB):**
```sql
public.is_project_team_member(p_project_id uuid) RETURNS boolean
-- Queries team_members without triggering RLS recursion
-- Used in projects SELECT policy for team member access
```

---

## CODE PATTERNS — READ BEFORE WRITING ANYTHING

### Server Components by Default
No `'use client'` unless you need: `onClick`, `useState`, `useEffect`, `useRef`, browser APIs, `useChat`, or Stripe Elements. When in doubt: Server Component.

### Data Fetching
All data fetching in Server Components. Never fetch in Client Components. Pass data as props.

### Mutations — Server Actions Only
All mutations in `/src/lib/actions/`. Never use API route handlers (`route.ts`) for CRUD. API routes are only for: streaming AI chat (`/api/chat/`), Stripe webhooks (`/api/stripe/webhook`), Accela integration (`/api/accela/`).

### Supabase Client Rules
```typescript
// Server Components, Server Actions, layouts:
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client Components ONLY:
import { createClient } from '@/lib/supabase/client'

// Admin — bypass RLS — Server Actions ONLY, never in files with 'use client':
import { createAdminClient } from '@/lib/supabase/admin'
const admin = createAdminClient()
// admin.ts uses 'server-only' import to prevent accidental client inclusion
```

### Server Action Pattern
```typescript
'use server'
export async function myAction(formData: FormData): Promise<{ data: X | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }
  // always use getUser() — never getSession() for auth checks
  const { data, error } = await supabase.from('table').insert({...})
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
```

### Authorization Pattern
```typescript
// Every page and action touching project data:
import { getUserRole } from '@/lib/utils/permissions'
const role = await getUserRole(user.id, projectId, supabase)
if (!role) notFound()
// Then use canManageTeam(role), canDeleteProject(role), etc.
// NEVER check project.user_id === user.id directly outside getUserRole()
```

### useOptimistic Pattern (status updates)
```typescript
// setOptimisticValue MUST be called inside startTransition — not before it
const [optimisticValue, setOptimisticValue] = useOptimistic(currentValue)
const [isPending, startTransition] = useTransition()
const handleChange = (newValue: string) => {
  startTransition(async () => {
    setOptimisticValue(newValue)  // inside startTransition
    await serverAction(newValue)
  })
}
```

### revalidatePath for Dynamic Segments
```typescript
revalidatePath('/projects/[id]', 'page')           // literal string — NOT the actual ID
revalidatePath('/homeowner/projects/[id]/explore', 'page')
// Always include 'page' type argument for dynamic routes
```

### Redirect After Mutation
```typescript
// redirect() MUST be outside try/catch
let deleteError = null
try {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) deleteError = error.message
} catch(e) {
  deleteError = 'Failed'
}
if (deleteError) return { error: deleteError }
redirect('/dashboard')  // outside try/catch
```

### maybeSingle() vs single()
```typescript
// single() — throws if 0 rows. Use only when row MUST exist.
// maybeSingle() — returns null if 0 rows. Use when absence is valid.

// WRONG for optional data:
const { data } = await supabase.from('permit_form_fills').select('*').eq('id', id).single()

// RIGHT:
const { data } = await supabase.from('permit_form_fills').select('*').eq('id', id).maybeSingle()
```

### Vercel AI SDK — Claude Streaming
```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { streamText, generateObject, generateText } from 'ai'
import { z } from 'zod'

// Streaming chat (API route, Edge runtime)
export const runtime = 'edge'
const result = await streamText({
  model: anthropic('claude-sonnet-4-6'),
  system: systemPrompt,
  messages,
  maxTokens: 1024,
})
return result.toDataStreamResponse()

// Structured output (Server Action)
const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-6'),
  schema: z.object({ field: z.string() }),
  system: systemPrompt,
  prompt: userPrompt,
})
```

### TypeScript Rules
- Strict mode — zero `any` types
- All DB row types in `/src/lib/types/index.ts`
- Use `Awaited<ReturnType<typeof createClient>>` for Supabase client typing in utilities

---

## DESIGN SYSTEM — INDUSTRIAL PRECISION

Dark-first, information-dense, professional. Contractors and homeowners trust this with $200k+ decisions.

### Color Variables (globals.css — already configured)
```css
--background: 220 13% 7%;      /* #0f1117 — deep dark slate */
--foreground: 220 9% 92%;
--card: 220 13% 10%;
--border: 220 13% 16%;
--primary: 35 95% 55%;         /* warm amber — Chosen signature */
--primary-foreground: 220 13% 7%;
--muted: 220 13% 13%;
--muted-foreground: 220 9% 52%;
--destructive: 0 72% 51%;
--radius: 0.375rem;
```

### StatusBadge Component (already built at `/src/components/ui/status-badge.tsx`)
Use `StatusBadge` for ALL status displays — never raw Badge for statuses.

| Status | Style |
|--------|-------|
| not_started | zinc-700 bg, zinc-300 text |
| submitted | blue-900 bg, blue-300 text |
| in_review | yellow-900 bg, yellow-300 text |
| corrections | red-900 bg, red-300 text |
| approved | green-900 bg, green-300 text |
| issued | emerald-800 bg, emerald-200 text |
| pending | orange-900 bg, orange-300 text |
| accepted | green-900 bg, green-300 text |

### Typography Rules
- Font: Geist — already in root layout
- Section labels: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- Headings: `font-semibold` or `font-bold`, never `font-normal`
- Stat numbers: `text-3xl font-bold text-primary`

### Layout Principles
- Section gaps: `gap-6`
- Card padding: `p-5` or `p-6`
- List rows: `py-3 border-b border-border/50`
- All interactive elements: `transition-all duration-150`
- Never white backgrounds — everything dark or card-dark
- Never rounded-full on status badges — use `rounded-sm` (stamp style)

### Impeccable Skills (installed globally)
After completing any full page, run:
- `/audit` — surface design issues
- `/polish` — fix inconsistencies
- `/normalize` — align with design system

### Computer Use (Claude Code feature)
Claude Code supports computer use for UI testing. Enable with `/mcp` in an interactive session. Use this to verify 3D map loads, test homeowner intake flow, and check permit fill interface visually. Requires Claude Code 2.1.85+ on macOS.

---

## PALO ALTO PERMIT RULES — COMPLETE REFERENCE

### Jurisdiction Details
- **City:** Palo Alto, Santa Clara County, California
- **Served zip codes:** 94301, 94303, 94304, 94306
- **NOT served:** 94305 (Stanford University — unincorporated Santa Clara County)
- **Accela portal:** aca-prod.accela.com/PALOALTO
- **Development Center:** 285 Hamilton Ave, Palo Alto CA 94301
- **Fire dept:** Palo Alto Fire Department — Fire Prevention Bureau (NOT Menlo Park Fire District)
- **School district fees:** PAUSD (Palo Alto Unified School District)

### Permit Requirements by Project Type

**Detached ADU (adu_detached):**
1. Building Permit — always required
2. Electrical Permit — always required
3. Plumbing Permit — always required
4. Mechanical Permit — always required
5. Palo Alto Fire Department Review — conditional: required if ANY of: ADU is west of Highway 280 / main house already has fire sprinklers / ADU is more than 150 ft from nearest public street
6. Title 24 Energy Compliance — always required (part of Building Permit package, not separate permit)
7. Grading and Drainage Plan — conditional: required if earthwork, grading, or drainage changes involved

**Attached ADU / JADU (adu_attached):**
1. Building Permit — always required
2. Electrical Permit — always required
3. Plumbing Permit — conditional: only if new plumbing added or existing modified
4. Mechanical Permit — conditional: only if HVAC modified
5. JADU Deed Restriction Recording — JADU only: must record with Santa Clara County Clerk-Recorder BEFORE building permit issuance. States unit cannot be sold separately and owner will occupy primary or JADU.
6. Grading and Drainage Plan — conditional: only if earthwork involved

**Addition (addition):**
1. Building Permit — always required
2. Electrical Permit — always required
3. Plumbing Permit — conditional: if any plumbing affected
4. Mechanical Permit — conditional: if any HVAC affected
5. School District Fee Clearance (PAUSD) — always required for additions with new habitable SF. Fee: $4.79/SF. Exempt: ADUs under 500 SF, JADUs entirely exempt.
6. Palo Alto Fire Department Review — conditional: required if: addition causes total floor area to exceed 3,600 SF / project removes or replaces 50%+ of roof or exterior walls / addition SF is 50%+ of existing floor area
7. Grading and Drainage Plan — conditional: if earthwork involved

**Remodel (remodel):**
1. Building Permit — always required
2. Electrical Permit — always required
3. Plumbing Permit — conditional: if plumbing touched
4. Mechanical Permit — conditional: if HVAC touched

### ADU Size Limits
| Type | Max Size | Height |
|------|---------|--------|
| State minimum standard | 800 SF | 16 ft |
| Palo Alto City Standard (1 bed) | 900 SF | 16 ft |
| Palo Alto City Standard (2+ bed) | 1,000 SF | 16 ft |
| Within ½ mile of major transit | Same | 18 ft |
| JADU (within existing structure) | 500 SF | N/A |

### Fee Overview
| Fee | Amount | Notes |
|-----|--------|-------|
| Building Permit | $2,000–$8,000 | 1.76% of construction value |
| School Fees (PAUSD) | $4.79/SF | Exempt: ADU <500 SF, JADU fully exempt |
| Development Impact Fees | $10,000–$80,000 | Exempt: ADU <750 SF |
| Fire Dept Review | $500–$2,000 | If triggered |
| Utility connections | Varies | Contact Palo Alto Utilities: 650-329-2161 |

### Inspection Sequence — Detached ADU (15 steps, seeded in DB)
1. Foundation/Footing — before concrete pour
2. Underground Plumbing — before backfill
3. Underground Electrical Conduit — before backfill
4. Framing — after framing complete, before insulation
5. Rough Electrical — after framing, before drywall
6. Rough Plumbing — after framing, before drywall
7. Rough Mechanical/HVAC — after framing, before drywall
8. Insulation — after ALL rough inspections pass
9. Drywall Nailing — if required by inspector
10. Final Electrical
11. Final Plumbing
12. Final Mechanical
13. Final Building
14. Fire Final — only if Fire Dept Review triggered; scheduled through Fire Prevention Bureau
15. Certificate of Occupancy — issued after all finals pass; required before occupancy

### Document Requirements — Building Permit (ADU/Addition)
- Site plan: property lines, existing structures, proposed ADU, setbacks, dimensions
- Floor plans: existing and proposed, minimum 1/4" = 1' scale
- Elevations: all four sides
- Building sections
- Structural calculations: stamped by California-licensed structural engineer
- Title 24 energy compliance (HERS report)
- CalGreen checklist
- Grading/drainage plan (if earthwork)
- Soils/geotechnical report (if required by building dept)

---

## BUILD PHASES — EXECUTE IN ORDER

**Phase 0 — COMPLETE ✅**
Full contractor dashboard: auth, project creation, conditional permit intake, permit workflow, documents, inspections, team (6 roles), role-based permissions, status tracking, UI polish (Industrial Precision theme).

**Phase 1 — COMPLETE ✅**
Database migrations 001–008 applied. npm packages installed (`ai`, `@ai-sdk/anthropic`, `resend`, `stripe`, `pdf-lib`, `pdf-parse`, `@googlemaps/js-api-loader`). All API keys configured in `.env.local` and Vercel. Domain chosenai.com purchased.

**Phase 2 — Marketing Homepage + Homeowner Intake**
Goal: Homeowner can visit chosenai.com, describe their project, and reach the explore page.

New files needed:
- `src/app/page.tsx` — Marketing homepage. Dark hero. Left: headline "Your home project, fully handled" + 3 value props + amber "Start Your Project →" CTA. Right: CesiumJS 3D auto-orbit of Palo Alto. "I'm a Contractor →" ghost link. "How it works" 4-step section below.
- `src/app/start/page.tsx` — 2-step homeowner intake. Step 1: Google Places Autocomplete address (restrict to Palo Alto zips), project type, description. Step 2: conditional yes/no questions (fire west of 280, sprinklers, earthwork). Submit calls `createHomeownerProject` server action → redirect to `/homeowner/projects/[id]/explore`.
- `src/app/(homeowner)/layout.tsx` — Homeowner nav layout.
- `src/app/(homeowner)/dashboard/page.tsx` — Homeowner project list with 6-step status timeline.
- `src/lib/actions/homeowner-projects.ts` — `createHomeownerProject()`: validate, Regrid lookup, INSERT homeowner_project, fire-and-forget `generateAIScope()`. `generateAIScope()`: fetch project + parcel data, call Claude with `generateObject()`, UPDATE homeowner_project with AI outputs + status `scope_ready`.

Regrid API call pattern (server-only):
```typescript
// Address typeahead lookup
const res = await fetch(
  `https://app.regrid.com/api/v2/parcels/typeahead?query=${encodeURIComponent(address)}&token=${process.env.REGRID_API_KEY}`
)
const json = await res.json()
const parcel = json.results?.[0]
// Extract: parcel.fields.ll_gisacre * 43560 = lot_size_sqft
// parcel.fields.zoning, parcel.fields.yearbuilt, parcel.fields.sqft
// parcel.geometry.coordinates = GeoJSON polygon for CesiumJS overlay
// parcel.fields.lat, parcel.fields.lon = centroid for map camera
```

Claude scope generation (Server Action, NOT edge):
```typescript
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'

const { object } = await generateObject({
  model: anthropic('claude-sonnet-4-6'),
  schema: z.object({
    scope_summary: z.string(),
    permit_checklist: z.array(z.object({
      name: z.string(),
      description: z.string(),
      required: z.boolean()
    })),
    cost_estimate_low: z.number(),
    cost_estimate_high: z.number(),
    timeline_weeks_low: z.number(),
    timeline_weeks_high: z.number(),
    feasibility_notes: z.string(),
    adu_max_sqft: z.number().optional(),
  }),
  system: PALO_ALTO_SCOPE_SYSTEM_PROMPT,  // see AI Prompts section below
  prompt: `Address: ${address}. Type: ${project_type}. Lot: ${lot_size_sqft} SF. Zoning: ${zoning}. Year built: ${year_built}. West of 280: ${fire_west_of_280}. Sprinklers: ${fire_sprinklers_exist}. Earthwork: ${has_earthwork}.`
})
```

**Phase 3 — Hero Explore Page (3D Map + AI Chat)**
The product's most important screen.

New files needed:
- `src/app/(homeowner)/projects/[id]/explore/page.tsx` — Server component. Fetch homeowner_project. Pass to client components. If `status === 'ai_processing'`, show loading with auto-refresh every 3s.
- `src/components/homeowner/ProjectExploreMap.tsx` — `'use client'`. CesiumJS 3D map. Load from CDN. Fly-in animation on mount. Amber parcel polygon overlay from Regrid GeoJSON.
- `src/components/homeowner/AIScopePanel.tsx` — Right panel. Scope summary, permit checklist, cost/timeline, "Post to Marketplace" button.
- `src/components/homeowner/ProjectChatWindow.tsx` — `'use client'`. `useChat` hook → `/api/chat/project`. Collapsible bottom strip. Streaming responses.
- `src/app/api/chat/project/route.ts` — Edge runtime. Auth check. Fetch project context. `streamText` with Claude. Persist conversation to `ai_conversations` fire-and-forget.

CesiumJS load pattern (CDN, not npm — avoids 50MB bundle):
```typescript
// In (homeowner)/layout.tsx:
import Script from 'next/script'
// <Script src="https://ajax.googleapis.com/ajax/libs/cesiumjs/1.124/Build/Cesium/Cesium.js" strategy="beforeInteractive" />
// <link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/cesiumjs/1.124/Build/Cesium/Widgets/widgets.css" />

// In ProjectExploreMap.tsx:
declare global { interface Window { Cesium: typeof import('cesium') } }
// Access as window.Cesium inside useEffect
```

CesiumJS Google 3D Tiles setup:
```typescript
window.Cesium.RequestScheduler.requestsByServer['tile.googleapis.com:443'] = 18
const viewer = new window.Cesium.Viewer('cesiumContainer', {
  imageryProvider: false,
  baseLayerPicker: false,
  geocoder: false,
  globe: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: false,
  requestRenderMode: true,
})
const tileset = await window.Cesium.createGooglePhotorealistic3DTileset({
  key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
})
viewer.scene.primitives.add(tileset)
// Fly-in: start 400m altitude, descend to 150m tilt 60° over parcel coords
viewer.camera.flyTo({
  destination: window.Cesium.Cartesian3.fromDegrees(lng, lat, 400),
  orientation: { heading: 0, pitch: -0.3, roll: 0 },
  duration: 3,
  complete: () => {
    viewer.camera.flyTo({
      destination: window.Cesium.Cartesian3.fromDegrees(lng, lat, 150),
      orientation: { heading: 0, pitch: -1.0, roll: 0 },
      duration: 2,
    })
  }
})
// Draw amber parcel polygon from Regrid GeoJSON
if (parcelGeometry) {
  const coords = parcelGeometry.coordinates[0].flat()
  viewer.entities.add({
    polygon: {
      hierarchy: window.Cesium.Cartesian3.fromDegreesArray(coords),
      material: new window.Cesium.ColorMaterialProperty(
        window.Cesium.Color.fromCssColorString('#F59E0B').withAlpha(0.25)
      ),
      outline: true,
      outlineColor: window.Cesium.Color.fromCssColorString('#F59E0B'),
      outlineWidth: 3,
      height: 1,
    }
  })
}
```

Streaming chat API route:
```typescript
// src/app/api/chat/project/route.ts
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
export const runtime = 'edge'
export async function POST(req: Request) {
  const { messages, projectId } = await req.json()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: project } = await supabase
    .from('homeowner_projects')
    .select('*')
    .eq('id', projectId)
    .eq('homeowner_id', user.id)
    .single()
  if (!project) return new Response('Not found', { status: 404 })
  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: buildProjectChatSystem(project),
    messages,
    maxTokens: 1024,
  })
  return result.toDataStreamResponse()
}
```

**Phase 4 — Contractor Marketplace**
New routes: `/marketplace` (project feed), `/marketplace/[projectId]` (detail + bid form), `/profile/[userId]` (public profile), `/profile/edit` (edit own profile), `/(homeowner)/projects/[id]/bids` (homeowner reviews bids).

New actions: `src/lib/actions/bids.ts` — `submitBid()`, `acceptBid()`, `withdrawBid()`. `src/lib/actions/profiles.ts` — `updateProfile()`, `uploadAvatar()`.

Email notifications via Resend:
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({
  from: 'Chosen <notifications@chosenai.com>',
  to: recipientEmail,
  subject: 'New bid on your project',
  text: `${bidderName} submitted a bid of $${amount} for ${timeline} weeks.`,
})
```

**Phase 5 — AI Permit Form Filling**
BEFORE WRITING ANY CODE: Download actual Palo Alto permit PDFs from cityofpaloalto.org. Catalog every form field. Save to `/docs/palo-alto-form-fields.json` with `ai_fillable` vs `human_required` categorization. This research is required first.

New routes: `/(dashboard)/projects/[id]/permits/[permitId]/fill`, `/review`, `/corrections`.
New actions: `src/lib/actions/permit-fills.ts` — `generateAIFormFill()`, `saveHumanAnswer()`, `assembleApplicationPackage()`.

PDF assembly with pdf-lib:
```typescript
import { PDFDocument } from 'pdf-lib'
const pdfBytes = await fetch('/forms/palo-alto-building-permit.pdf').then(r => r.arrayBuffer())
const pdfDoc = await PDFDocument.load(pdfBytes)
const form = pdfDoc.getForm()
Object.entries(finalFields).forEach(([fieldName, value]) => {
  try { form.getTextField(fieldName).setText(String(value ?? '')) } catch {}
})
const filledBytes = await pdfDoc.save()
// Upload to Supabase Storage: permit-applications/{projectId}/{permitId}/application.pdf
```

**Phase 6 — Accela Auto-Submit**
Architecture: Chosen (Vercel) → POST `/api/accela/submit` → Railway Express service → Playwright → Accela portal at `aca-prod.accela.com/PALOALTO`.

Railway service is a separate repo (`chosen-accela-service`). Simple Express server. Playwright navigates Accela, logs in with service account, fills forms, uploads PDF, submits, returns `{ accela_record_id }`.

New routes: `src/app/api/accela/submit/route.ts`, `src/app/api/accela/status/route.ts`.
New page: `/(dashboard)/projects/[id]/permits/[permitId]/review/page.tsx` — pre-submission PDF preview + submit button.

**Phase 7 — Correction Letter Processing**
New page: `/(dashboard)/projects/[id]/permits/[permitId]/corrections/page.tsx` — drag-drop PDF upload → AI parsing → issue list → apply corrections → resubmit.

PDF text extraction:
```typescript
import pdfParse from 'pdf-parse'
const pdfBuffer = Buffer.from(await fetch(fileUrl).then(r => r.arrayBuffer()))
const { text } = await pdfParse(pdfBuffer)
// Send text to Claude with generateObject for structured issue extraction
```

**Phase 8 — Milestone Payments (Stripe Connect)**

Milestone structure (src/lib/stripe/milestones.ts):
```typescript
export const MILESTONE_TEMPLATES = {
  adu_detached: [
    { name: 'Design Deposit', order: 1, pct: 0.05 },
    { name: 'Permit Application Filed', order: 2, pct: 0.10 },
    { name: 'Permit Approved', order: 3, pct: 0.10 },
    { name: 'Foundation Complete', order: 4, pct: 0.20 },
    { name: 'Framing Complete', order: 5, pct: 0.20 },
    { name: 'Rough Inspections Complete', order: 6, pct: 0.20 },
    { name: 'Certificate of Occupancy', order: 7, pct: 0.15 },
  ]
}
```

Stripe Connect contractor onboarding:
```typescript
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })
const account = await stripe.accounts.create({ type: 'express', country: 'US' })
const link = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${origin}/profile/edit?stripe=refresh`,
  return_url: `${origin}/profile/edit?stripe=success`,
  type: 'account_onboarding',
})
redirect(link.url)
```

Destination charge (homeowner pays, contractor receives minus platform fee):
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: milestone.amount_cents,
  currency: 'usd',
  transfer_data: { destination: contractorStripeAccountId },
  application_fee_amount: Math.round(milestone.amount_cents * 0.025),  // 2.5% Chosen fee
  metadata: { milestone_id: milestone.id },
})
```

Stripe webhook route MUST use raw body — never body parser:
```typescript
// src/app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text()   // req.text() not req.json()
  const sig = req.headers.get('stripe-signature')!
  const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  // handle event.type
  return new Response('ok')
}
```

**Phase 9 — Homeowner Dashboard + Polish**
`/(homeowner)/dashboard/page.tsx` — Project cards with `ProjectStatusTimeline` component showing 6-step horizontal progress (Scoping → Marketplace → Team Selected → Permitting → Construction → Complete). Next action CTAs prominent on each card.

---

## AI SYSTEM PROMPTS

### Palo Alto Scope Generation System Prompt
Store this in `src/lib/ai/project-scope.ts`:
```
You are Chosen's permit intelligence engine for Palo Alto, California residential construction.

You have expert knowledge of:
- Palo Alto's ADU ordinances, setback requirements, and development standards
- California state ADU law (AB 976, SB 1211, AB 2221, AB 2533 — 2025 updates)
- The difference between Palo Alto City Standard ADUs (900-1000 SF) and state minimum ADUs (800 SF)
- Which permits are required for each project type and what triggers conditional permits
- Realistic Bay Area construction costs ($400-600/SF for ADUs as of 2026)
- Palo Alto permit timelines (typically 2-6 months for ADUs)
- PAUSD school fee exemptions (ADU under 500 SF exempt, JADU fully exempt)
- Development impact fee exemptions (ADU under 750 SF exempt)

When generating a scope:
1. Be specific about which size standard applies (state vs. Palo Alto city standard)
2. List ONLY permits that actually apply based on the provided intake answers
3. Give realistic cost ranges — do not underestimate Bay Area costs
4. Flag any feasibility concerns (lot too small, setback violations, fire review triggers)
5. Return cost_estimate_low and cost_estimate_high as integers in dollars

Write scope_summary in plain English for homeowners — avoid jargon.
Use official Palo Alto permit names exactly as used by the city.
```

### Project Chat System Prompt
Store in `src/lib/ai/project-scope.ts` as `buildProjectChatSystem(project)`:
```
You are Chosen's AI assistant helping a homeowner understand their {project_type} project
at {address}, Palo Alto, CA.

Property: {lot_size_sqft} SF lot, {existing_sqft} SF existing structure, built {year_built},
zoning {zoning} ({zoning_description}).

AI scope summary: {ai_scope_summary}

Answer questions about permits, costs, timeline, and the construction process.
Be honest about uncertainties. Recommend consulting their architect/contractor for
site-specific physical questions. Never guarantee permit approval outcomes.
Keep responses to 2-4 sentences unless detail is requested.
Tone: knowledgeable neighbor, not formal consultant.
```

### Correction Letter Parse System Prompt
Store in `src/lib/ai/correction-parse.ts`:
```
You are analyzing a City of Palo Alto building department plan check correction letter.
Extract every required correction as a structured list.
For each correction: identify the specific form field or plan sheet it affects,
state the exact fix needed, and determine if it is blocking (prevents permit issuance).
Use official Palo Alto form field names when known.
Return ALL corrections — do not summarize or omit any.
```

---

## EXTERNAL API REFERENCE

### Regrid (parcel data — server only)
Base: `https://app.regrid.com/api/v2/`
Auth: `?token=${process.env.REGRID_API_KEY}` query param
```typescript
// Address typeahead
GET /parcels/typeahead?query={address}&token={key}
// Returns results[]. Take results[0].
// Key fields:
// fields.ll_gisacre * 43560 = lot_size_sqft
// fields.zoning, fields.zoning_description
// fields.yearbuilt, fields.sqft
// fields.lat, fields.lon = centroid
// geometry.coordinates = GeoJSON polygon
```

### Google Maps 3D Tiles
- Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (browser-safe, restricted to chosenai.com)
- CesiumJS 1.124 from CDN — do NOT npm install cesium
- Coverage: Palo Alto is covered (Bay Area has full photorealistic coverage)
- Cost: 1,000 free Enterprise SKU events/month — adequate for MVP volume

### Vercel AI SDK + Claude
```typescript
// Always use claude-sonnet-4-6 — not haiku (too weak), not opus (too expensive)
// Haiku 4.5: $1/$5 per M tokens — too weak for permit analysis
// Sonnet 4.6: $3/$15 per M tokens — correct choice for all operations
// Opus 4.6: $5/$25 per M tokens — overkill, don't use
// Your Max plan does NOT cover API usage — separate billing via console.anthropic.com
// Expected cost at MVP scale (100 projects/month): ~$10-30/month
// Use prompt caching for repeated system prompts (90% savings on cache hits)
```

### Stripe Connect
```typescript
// apiVersion: '2025-08-27.basil' — use this version string
// Account type: 'express' — fastest KYC for contractors
// Charge type: destination charges — platform is merchant of record
// Platform fee: 2.5% via application_fee_amount
// Webhook: MUST use req.text() not req.json() — raw body required for signature verification
```

### Resend
```typescript
// from: 'Chosen <notifications@chosenai.com>'
// Domain verified at chosenai.com
// Free tier: 3,000 emails/month — adequate for MVP
// Send from server actions only — never client components
```

---

## CRITICAL RULES — ABSOLUTE, NEVER VIOLATE

1. **ALWAYS read `node_modules/next/dist/docs/` before writing Next.js code** — this is Next.js 16 with breaking changes from training data.

2. **`getUserRole()` is the authorization oracle** — every server action and page touching project data calls this. No direct `project.user_id === user.id` checks anywhere else.

3. **`maybeSingle()` when absence is valid** — `single()` throws on zero rows. The most common production crash.

4. **CesiumJS from CDN, not npm** — `npm install cesium` adds 50MB to the bundle and breaks Vercel builds. Always load from googleapis CDN via Next.js Script tag.

5. **Regrid is server-only** — `REGRID_API_KEY` never in client components. Always through server actions.

6. **Stripe webhook needs raw body** — `req.text()` not `req.json()` in the webhook route handler.

7. **Claude API is separate billing from Max plan** — `ANTHROPIC_API_KEY` uses pay-per-token billing from console.anthropic.com regardless of subscription status.

8. **`setOptimisticValue` inside `startTransition`** — calling it outside throws a React error in Next.js 16.

9. **`revalidatePath` uses literal segment strings** — `'/projects/[id]'` not the actual UUID.

10. **`redirect()` outside try/catch** — Next.js `redirect()` throws internally; wrapping it in try/catch silently catches it and the redirect never fires.

11. **`'use client'` only for interactivity** — no data fetching in client components, no Supabase calls in client components except for real-time subscriptions.

12. **Admin client (`createAdminClient`) bypasses RLS** — only use for team member email lookup, admin operations. Never for normal data reads.

---

## PENDING INFRASTRUCTURE (DNS NOT YET COMPLETE)

The following is still pending and will be done when Axel is available:

**GoDaddy DNS for chosenai.com:**
- Delete "Parked" A record for `@`
- A record: `@` → `216.198.79.1` (Vercel)
- CNAME: `www` → `f9add46275b04cff.vercel-dns-017.com.`
- Add Resend DNS records (TXT for DKIM + SPF + MX)

**After DNS:**
- Verify Resend domain at resend.com → Domains
- Verify chosenai.com and www.chosenai.com in Vercel → Settings → Domains

These are infrastructure tasks only — no code changes needed.

---

## NORTH STAR

When Chosen is complete, a Palo Alto homeowner can:

1. Type their address on chosenai.com
2. See their actual property in photorealistic 3D in under 5 seconds
3. Read an AI-generated project scope with real cost estimates in under 60 seconds
4. Post to the marketplace and receive bids from verified Palo Alto contractors, architects, and engineers
5. Watch AI fill every permit application automatically
6. Answer 5–10 physical questions only they can know from being on-site
7. Submit to the City of Palo Alto with one click
8. Drag in correction letters and watch AI fix and resubmit automatically
9. Track every inspection, release milestone payments as work progresses
10. Receive their Certificate of Occupancy — entirely inside Chosen

Build toward this relentlessly.