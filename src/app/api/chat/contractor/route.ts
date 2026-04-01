export const runtime = "edge"

import { streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"
import { buildContractorChatSystem } from "@/lib/ai/project-scope"
import type { Project } from "@/lib/types"

export async function POST(req: Request) {
  const { messages: rawMessages, projectId } = await req.json()

  const coreMessages = rawMessages
    .map(
      (m: {
        role: string
        parts?: { type: string; text: string }[]
        content?: string
      }) => ({
        role: m.role as "user" | "assistant",
        content: m.parts
          ? m.parts
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("")
          : (m.content ?? ""),
      })
    )
    .filter((m: { content: string }) => m.content.length > 0)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response("Unauthorized", { status: 401 })

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!project) return new Response("Not found", { status: 404 })

  const result = await streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildContractorChatSystem(project as Project),
    messages: coreMessages,
    maxOutputTokens: 1024,
  })

  return result.toUIMessageStreamResponse()
}
