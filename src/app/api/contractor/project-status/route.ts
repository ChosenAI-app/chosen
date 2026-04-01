import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: project } = await supabase
    .from("projects")
    .select("scope_description")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  let hasScope = false
  try {
    const parsed = JSON.parse(project.scope_description ?? "{}")
    hasScope = !!parsed.ai_scope
  } catch {
    // Not JSON
  }

  return NextResponse.json({ hasScope })
}
