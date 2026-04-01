"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Resend } from "resend"

const ROLE_LABELS: Record<string, string> = {
  co_owner: "Co-Owner",
  architect: "Architect",
  engineer: "Engineer",
  inspector: "Inspector",
  client: "Client",
}

export async function inviteTeamMember(
  formData: FormData
): Promise<{ error: string | null }> {
  const projectId = formData.get("projectId") as string | null
  const rawEmail = formData.get("email") as string | null
  const role = formData.get("role") as string | null

  if (!projectId || !rawEmail || !role) {
    return { error: "All fields are required." }
  }

  const VALID_INVITABLE_ROLES = [
    "co_owner",
    "architect",
    "engineer",
    "inspector",
    "client",
  ]
  if (!VALID_INVITABLE_ROLES.includes(role)) {
    return { error: "Invalid role." }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(rawEmail)) {
    return { error: "Please enter a valid email address." }
  }

  const normalizedEmail = rawEmail.toLowerCase().trim()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated." }
  }

  if (normalizedEmail === user.email?.toLowerCase()) {
    return { error: "You are already on this project as the contractor." }
  }

  const { data: project } = await supabase
    .from("projects")
    .select("user_id, address, project_type")
    .eq("id", projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    return { error: "Project not found." }
  }

  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("invited_email", normalizedEmail)
    .maybeSingle()

  if (existingMember) {
    return { error: "This person is already on the project." }
  }

  // Check if email has an existing account (for user_id link, but always pending)
  let existingUserId: string | null = null
  let isExistingUser = false

  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    const existing = data?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    )
    if (existing) {
      existingUserId = existing.id
      isExistingUser = true
    }
  } catch {
    // Non-blocking — proceed without user_id link
  }

  // All invites start as PENDING — no auto-approve
  const { error: insertError } = await supabase
    .from("team_members")
    .insert({
      project_id: projectId,
      user_id: existingUserId,
      role,
      invited_email: normalizedEmail,
      invite_status: "pending",
    })

  if (insertError) {
    return { error: insertError.message }
  }

  // Send email
  const projectAddress =
    project.address?.replace(/, USA$/, "") ?? "a project"
  const projectType =
    project.project_type?.replace(/_/g, " ") ?? "project"
  const roleLabel = ROLE_LABELS[role] ?? role

  const { data: inviterProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()
  const inviterName = inviterProfile?.full_name ?? "A contractor"

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    if (isExistingUser) {
      await resend.emails.send({
        from: "Chosen <notifications@chosenai.com>",
        to: normalizedEmail,
        subject: `${inviterName} invited you to a project on Chosen`,
        text: `Hi,

${inviterName} has invited you to collaborate on a ${projectType} project at ${projectAddress} as ${roleLabel}.

Log in to Chosen to review and accept the invitation:

https://chosenai.com/invitations

— The Chosen Team`,
      })
    } else {
      await resend.emails.send({
        from: "Chosen <notifications@chosenai.com>",
        to: normalizedEmail,
        subject: `${inviterName} invited you to collaborate on a construction project`,
        text: `Hi,

${inviterName} has invited you to collaborate on a ${projectType} project at ${projectAddress} on Chosen as ${roleLabel}.

Chosen is the platform for residential construction project management and permitting in Palo Alto.

Create your free account to accept this invitation:

https://chosenai.com/signup

Once you sign up with this email address (${normalizedEmail}), you'll automatically see the pending invitation.

— The Chosen Team`,
      })
    }
    console.log(
      "[team invite] Email sent to:",
      normalizedEmail,
      "existing user:",
      isExistingUser
    )
  } catch (emailErr) {
    console.error("[team invite] Email failed (non-blocking):", emailErr)
  }

  revalidatePath("/projects/[id]", "page")
  return { error: null }
}

export async function acceptInvitation(
  inviteId: string,
  projectId: string
): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("team_members")
    .update({
      invite_status: "accepted",
      user_id: user.id,
    })
    .eq("id", inviteId)
    .eq("invited_email", user.email!)

  revalidatePath("/invitations")
  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function declineInvitation(inviteId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from("team_members")
    .update({ invite_status: "declined" })
    .eq("id", inviteId)
    .eq("invited_email", user.email!)

  revalidatePath("/invitations")
}

export async function removeTeamMember(
  memberId: string,
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated." }
  }

  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    return { error: "Project not found." }
  }

  const { error: deleteError } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("project_id", projectId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath("/projects/[id]", "page")
  return { error: null }
}
