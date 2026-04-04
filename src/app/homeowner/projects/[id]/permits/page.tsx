import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react"
import { SubmitToAccelaButton } from "@/components/homeowner/permits/SubmitToAccelaButton"
import { AccelaSubmissionStatus } from "@/components/homeowner/permits/AccelaSubmissionStatus"
import type { HomeownerProject } from "@/lib/types"

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

  // Check for existing submission
  const admin = createAdminClient()
  const { data: submission } = await admin
    .from("accela_submissions")
    .select("*")
    .eq("homeowner_project_id", id)
    .order("created_at", { ascending: false })
    .maybeSingle()

  // AI scope as the "pre-filled form"
  const hasScope = !!hp.ai_scope_summary

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/homeowner/projects/${id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to project
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Permit Package</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hp.address?.replace(/, USA$/, "")}
        </p>
      </div>

      {/* AI-generated scope as the permit form data */}
      {hasScope && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <FileText className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Building Permit Application</p>
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

          {/* Summary of pre-filled data */}
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-muted/30 p-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium">
                {hp.address?.replace(/, USA$/, "")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Project Type</p>
              <p className="font-medium">
                {hp.project_type?.replace(/_/g, " ")}
              </p>
            </div>
            {hp.lot_size_sqft && (
              <div>
                <p className="text-xs text-muted-foreground">Lot Size</p>
                <p className="font-medium">
                  {hp.lot_size_sqft.toLocaleString()} SF
                </p>
              </div>
            )}
            {hp.ai_cost_estimate_low && hp.ai_cost_estimate_high && (
              <div>
                <p className="text-xs text-muted-foreground">Est. Cost</p>
                <p className="font-medium">
                  ${hp.ai_cost_estimate_low.toLocaleString()}–$
                  {hp.ai_cost_estimate_high.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* AI Scope summary */}
          {hp.ai_scope_summary && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">Scope Summary</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground line-clamp-4">
                {hp.ai_scope_summary}
              </p>
            </div>
          )}
        </div>
      )}

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

      {/* Submission status (if already submitted) */}
      {submission && <AccelaSubmissionStatus submission={submission} />}

      {/* Submit button (if scope ready and not yet submitted) */}
      {!submission && hasScope && (
        <SubmitToAccelaButton projectId={id} />
      )}
    </div>
  )
}
