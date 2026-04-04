import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRecordStatus } from "@/lib/accela/client"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const { data: submissions } = await adminClient
    .from("accela_submissions")
    .select(
      "id, accela_record_id, homeowner_project_id, status, retry_count"
    )
    .in("status", ["submitted", "in_review"])
    .lte("next_status_check", new Date().toISOString())
    .not("accela_record_id", "is", null)
    .limit(20)

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ checked: 0 })
  }

  let updated = 0
  for (const submission of submissions) {
    try {
      const { status } = await getRecordStatus(submission.accela_record_id!)

      let chosenStatus = submission.status
      if (status === "Issued" || status === "Approved") {
        chosenStatus = "approved"
      } else if (status === "Pending" || status === "In Review") {
        chosenStatus = "in_review"
      } else if (
        status === "Incomplete" ||
        status === "Corrections Required"
      ) {
        chosenStatus = "corrections_required"
      } else if (status === "Denied" || status === "Rejected") {
        chosenStatus = "rejected"
      }

      const nextCheck = new Date()
      if (chosenStatus === "submitted") {
        nextCheck.setDate(nextCheck.getDate() + 1)
      } else if (chosenStatus === "in_review") {
        nextCheck.setDate(nextCheck.getDate() + 3)
      } else {
        nextCheck.setDate(nextCheck.getDate() + 7)
      }

      await adminClient
        .from("accela_submissions")
        .update({
          status: chosenStatus,
          last_status_check: new Date().toISOString(),
          next_status_check: nextCheck.toISOString(),
        })
        .eq("id", submission.id)

      updated++
    } catch (err) {
      console.error(`[Accela Poll] Failed to check ${submission.id}:`, err)
    }
  }

  return NextResponse.json({ checked: submissions.length, updated })
}
