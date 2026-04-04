import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Building2,
  MapPin,
  DollarSign,
} from "lucide-react"
import { SubmitToAccelaButton } from "@/components/homeowner/permits/SubmitToAccelaButton"
import { AccelaSubmissionStatus } from "@/components/homeowner/permits/AccelaSubmissionStatus"
import { ApplicantTypeSelector } from "@/components/homeowner/permits/ApplicantTypeSelector"
import type { HomeownerProject } from "@/lib/types"

const PROJECT_TYPE_LABELS: Record<string, string> = {
  adu_detached: "Detached ADU",
  adu_attached: "Attached ADU",
  jadu: "Junior ADU",
  addition: "Residential Addition",
  remodel: "Interior Remodel",
  new_construction: "New Construction",
  conversion: "Conversion",
}

export default async function PermitsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: project } = await supabase
    .from("homeowner_projects")
    .select("*")
    .eq("id", id)
    .eq("homeowner_id", user.id)
    .maybeSingle()

  if (!project) notFound()

  const hp = project as HomeownerProject
  const hasScope = !!hp.ai_scope_summary

  // Check for existing submission
  const admin = createAdminClient()
  const { data: submission } = await admin
    .from("accela_submissions")
    .select("*")
    .eq("homeowner_project_id", id)
    .order("created_at", { ascending: false })
    .maybeSingle()

  // Get permit checklist from AI scope
  const permitChecklist = hp.ai_permit_checklist ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/homeowner/projects/${id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to project
        </Link>
        <Link
          href={`/homeowner/projects/${id}/explore`}
          className="text-xs text-primary hover:underline"
        >
          View AI analysis →
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Permit Package</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hp.address?.replace(/, USA$/, "")}
        </p>
      </div>

      {/* No scope yet */}
      {!hasScope && (
        <div className="rounded-lg border border-border bg-card/50 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            AI scope not yet generated. Go to the{" "}
            <Link
              href={`/homeowner/projects/${id}/explore`}
              className="text-primary hover:underline"
            >
              explore page
            </Link>{" "}
            to generate your project scope first.
          </p>
        </div>
      )}

      {/* Scope ready — show the permit flow */}
      {hasScope && (
        <>
          {/* Step 1 — Project summary card */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">
                  {hp.address?.replace(/, USA$/, "")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PROJECT_TYPE_LABELS[hp.project_type] ?? hp.project_type}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {hp.lot_size_sqft && (
                <div className="rounded bg-muted/30 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Lot Size
                  </p>
                  <p className="text-sm font-medium">
                    {hp.lot_size_sqft.toLocaleString()} SF
                  </p>
                </div>
              )}
              {hp.year_built && (
                <div className="rounded bg-muted/30 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Year Built
                  </p>
                  <p className="text-sm font-medium">{hp.year_built}</p>
                </div>
              )}
              {hp.ai_cost_estimate_low && hp.ai_cost_estimate_high && (
                <div className="col-span-2 rounded bg-muted/30 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Estimated Cost
                  </p>
                  <p className="text-sm font-bold text-primary">
                    ${hp.ai_cost_estimate_low.toLocaleString()}–$
                    {hp.ai_cost_estimate_high.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2 — Required permits from AI scope */}
          {permitChecklist.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Required Permits
              </h3>
              <div className="flex flex-col gap-2">
                {permitChecklist.map(
                  (
                    permit: {
                      name: string
                      description: string
                      required: boolean
                    },
                    i: number
                  ) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`mt-0.5 size-4 shrink-0 ${
                          permit.required
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{permit.name}</p>
                        {permit.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {permit.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step 3 — AI scope summary as "pre-filled application" */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="size-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    Building Permit Application
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Pre-filled from your AI project scope
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                <CheckCircle2 className="size-3.5" />
                Ready
              </div>
            </div>

            {hp.ai_scope_summary && (
              <div className="mt-3 rounded bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">
                  Scope Summary
                </p>
                <p className="mt-1 text-sm leading-relaxed line-clamp-4">
                  {hp.ai_scope_summary}
                </p>
              </div>
            )}
          </div>

          {/* Step 4 — Applicant type selection */}
          {!submission && (
            <ApplicantTypeSelector projectId={id} />
          )}

          {/* Submission status (if already submitted) */}
          {submission && <AccelaSubmissionStatus submission={submission} />}

          {/* Submit button (if not yet submitted) */}
          {!submission && (
            <SubmitToAccelaButton projectId={id} />
          )}
        </>
      )}
    </div>
  )
}
