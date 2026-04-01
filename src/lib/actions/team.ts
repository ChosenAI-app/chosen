/*
 * SETUP REQUIRED before testing:
 * 1. Add to .env.local:
 *    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *    Get from: Supabase dashboard → Settings → API →
 *    Service role key (keep secret!)
 * 2. Add same var to Vercel environment variables
 * 3. Never commit this key to git
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function inviteTeamMember(
  formData: FormData
): Promise<{ error: string | null }> {
  // a. Extract fields
  const projectId = formData.get("projectId") as string | null;
  const rawEmail = formData.get("email") as string | null;
  const role = formData.get("role") as string | null;

  // b. Validate
  if (!projectId || !rawEmail || !role) {
    return { error: "All fields are required." };
  }

  const VALID_INVITABLE_ROLES = [
    "co_owner",
    "architect",
    "engineer",
    "inspector",
    "client",
  ];
  if (!VALID_INVITABLE_ROLES.includes(role)) {
    return { error: "Invalid role." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(rawEmail)) {
    return { error: "Please enter a valid email address." };
  }

  // c. Normalize
  const normalizedEmail = rawEmail.toLowerCase().trim();

  // d. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // Check owner cannot invite themselves
  if (normalizedEmail === user.email?.toLowerCase()) {
    return { error: "You are already on this project as the contractor." };
  }

  // e. Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Project not found." };
  }

  // f. Duplicate check
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("invited_email", normalizedEmail)
    .maybeSingle();

  if (existingMember) {
    return { error: "This person is already on the project." };
  }

  // g. Look up if email has a Chosen account
  let existingUserId: string | null = null;
  let inviteStatus: "accepted" | "pending" = "pending";

  try {
    const admin = createAdminClient();
    const { data, error: adminError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (adminError) {
      return { error: adminError.message };
    }

    const existing = data.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existing) {
      existingUserId = existing.id;
      inviteStatus = "accepted";
    }
  } catch {
    return { error: "Failed to look up user." };
  }

  // h. Insert team member
  const { error: insertError } = await supabase
    .from("team_members")
    .insert({
      project_id: projectId,
      user_id: existingUserId,
      role,
      invited_email: normalizedEmail,
      invite_status: inviteStatus,
    });

  if (insertError) {
    return { error: insertError.message };
  }

  // i. Send invite email via Resend
  try {
    const { data: proj } = await supabase
      .from("projects")
      .select("address")
      .eq("id", projectId)
      .maybeSingle();

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Chosen <notifications@chosenai.com>",
      to: normalizedEmail,
      subject: "You've been invited to collaborate on a project",
      text: `You've been invited to join a project on Chosen as ${role}.

Sign up or log in at chosenai.com to accept the invitation and access the project.

Project address: ${proj?.address ?? "Palo Alto project"}
Your role: ${role}

Questions? Reply to this email.`,
    });
    console.log("[team invite] Email sent to:", normalizedEmail);
  } catch (emailErr) {
    console.error("[team invite] Email failed (non-blocking):", emailErr);
  }

  // j. Revalidate
  revalidatePath("/projects/[id]", "page");

  // k. Return
  return { error: null };
}

export async function removeTeamMember(
  memberId: string,
  projectId: string
): Promise<{ error: string | null }> {
  // a. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // b. Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Project not found." };
  }

  // c. Delete
  const { error: deleteError } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("project_id", projectId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // d. Revalidate
  revalidatePath("/projects/[id]", "page");

  // e. Return
  return { error: null };
}
