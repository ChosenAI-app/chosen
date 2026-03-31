import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: project } = await supabase
    .from("homeowner_projects")
    .select(
      "status, ai_scope_summary, ai_cost_estimate_low, ai_cost_estimate_high, map_lat, map_lng"
    )
    .eq("id", id)
    .eq("homeowner_id", user.id)
    .maybeSingle()

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ status: project.status })
}
