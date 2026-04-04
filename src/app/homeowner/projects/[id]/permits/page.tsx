import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { FormFillCard } from "@/components/homeowner/permits/FormFillCard"
import { GenerateFormsButton } from "@/components/homeowner/permits/GenerateFormsButton"
import { SubmitToAccelaButton } from "@/components/homeowner/permits/SubmitToAccelaButton"
import { AccelaSubmissionStatus } from "@/components/homeowner/permits/AccelaSubmissionStatus"

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

  // Fetch form fills
  const { data: formFills } = await supabase
    .from("permit_form_fills")
    .select("*")
    .eq("homeowner_project_id", id)
    .order("created_at", { ascending: true })

  // Fetch submission
  const admin = createAdminClient()
  const { data: submission } = await admin
    .from("accela_submissions")
    .select("*")
    .eq("homeowner_project_id", id)
    .order("created_at", { ascending: false })
    .maybeSingle()

  const hasFormFills = formFills && formFills.length > 0
  const allApproved =
    hasFormFills && formFills.every((f) => f.status === "approved")
  const totalFlagged =
    formFills?.reduce(
      (sum, f) =>
        sum + ((f.flagged_fields as unknown[])?.length ?? 0),
      0
    ) ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasScope = !!(project as any).ai_scope_summary
  const address = project.address?.replace(/, USA$/, "")

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/homeowner/projects/${id}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to project
        </Link>
        {hasFormFills && (
          <GenerateFormsButton projectId={id} label="Regenerate" />
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">Permit Package</h1>
        <p className="mt-1 text-sm text-muted-foreground">{address}</p>
      </div>

      {/* Status summary */}
      {hasFormFills && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${
            allApproved
              ? "border-green-900/50 bg-green-950/20"
              : totalFlagged > 0
                ? "border-amber-900/40 bg-amber-950/10"
                : "border-border bg-card"
          }`}
        >
          {allApproved ? (
            <CheckCircle2 className="size-5 shrink-0 text-green-400" />
          ) : (
            <AlertTriangle className="size-5 shrink-0 text-amber-400" />
          )}
          <div>
            <p
              className={`text-sm font-semibold ${allApproved ? "text-green-400" : "text-amber-400"}`}
            >
              {allApproved
                ? "All forms approved — ready to submit to city"
                : `${totalFlagged} field${totalFlagged !== 1 ? "s" : ""} still need your input`}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {allApproved
                ? "Review the certification below and click submit"
                : "Open each form below to answer the highlighted questions"}
            </p>
          </div>
        </div>
      )}

      {/* No scope yet */}
      {!hasScope && (
        <div className="rounded-lg border border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Generate your AI scope first on the{" "}
            <Link
              href={`/homeowner/projects/${id}/explore`}
              className="text-primary hover:underline"
            >
              explore page
            </Link>{" "}
            before coming here.
          </p>
        </div>
      )}

      {/* No forms yet — show generate button */}
      {hasScope && !hasFormFills && (
        <div className="flex flex-col items-center gap-5 rounded-lg border border-border bg-card p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              Generate your permit package
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Chosen will pre-fill all required City of Palo Alto permit
              forms using your property data and AI scope. You review each
              field and answer ~5 questions AI can&apos;t answer automatically.
            </p>
          </div>

          <div className="grid w-full max-w-sm grid-cols-2 gap-3 text-left">
            {[
              ["Building Permit", "~80% pre-filled"],
              ["Utility Service", "~70% pre-filled"],
              [
                "SB-407 Plumbing",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (project as any).year_built > 1994
                  ? "Auto-exempt ✓"
                  : "~85% pre-filled",
              ],
              ["Fire Checklist", "~90% pre-filled"],
            ].map(([name, pct]) => (
              <div key={name} className="rounded-md bg-muted/30 p-3">
                <p className="text-xs font-medium leading-tight">{name}</p>
                <p className="mt-1 text-[10px] text-primary">{pct}</p>
              </div>
            ))}
          </div>

          <GenerateFormsButton projectId={id} />
        </div>
      )}

      {/* Form fill cards */}
      {hasFormFills && (
        <div className="flex flex-col gap-4">
          {formFills.map((fill) => (
            <FormFillCard key={fill.id} fill={fill} />
          ))}
        </div>
      )}

      {/* Submit section */}
      {hasFormFills && !submission && allApproved && (
        <SubmitToAccelaButton projectId={id} />
      )}

      {hasFormFills && !submission && !allApproved && (
        <div className="rounded-lg border border-border bg-card/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Answer all highlighted fields above to unlock city submission.
          </p>
        </div>
      )}

      {submission && <AccelaSubmissionStatus submission={submission} />}
    </div>
  )
}
