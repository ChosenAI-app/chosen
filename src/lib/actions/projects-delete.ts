"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deleteProject(
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const redirectPath = "/dashboard";

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated." };

    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return { error: "Not found." };
    }

    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (deleteError) return { error: deleteError.message };
  } catch {
    return { error: "Failed to delete project." };
  }

  redirect(redirectPath);
}
