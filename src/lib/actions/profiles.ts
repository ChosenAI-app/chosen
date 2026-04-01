"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("profiles")
    .update({
      company_name: (formData.get("company_name") as string) || null,
      license_number: (formData.get("license_number") as string) || null,
      bio: (formData.get("bio") as string) || null,
      phone: (formData.get("phone") as string) || null,
      website_url: (formData.get("website_url") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/marketplace/profile/edit")
  revalidatePath("/marketplace/profile/[userId]", "page")
  return { error: null }
}
