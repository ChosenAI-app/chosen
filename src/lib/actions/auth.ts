"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  let errorMessage: string | null = null
  let userId: string | null = null

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      errorMessage = error.message
    } else {
      userId = data.user?.id ?? null
    }
  } catch {
    errorMessage = "An unexpected error occurred."
  }

  if (errorMessage) {
    return { error: errorMessage }
  }

  // Route based on user_type
  let destination = "/dashboard"
  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .maybeSingle()

    if (profile?.user_type === "homeowner") {
      destination = "/homeowner/dashboard"
    }
  }

  redirect(destination)
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  userType: string = "homeowner"
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  console.log("[signUp] received params:", { fullName, userType })
  console.log("[signUp] calling supabase.auth.signUp with metadata:", {
    full_name: fullName,
    user_type: userType,
  })

  let errorMessage: string | null = null

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, user_type: userType },
      },
    })

    console.log("[signUp] result:", {
      userId: data?.user?.id,
      error: error?.message,
    })
    console.log("[signUp] user metadata stored:", data?.user?.user_metadata)

    if (error) {
      errorMessage = error.message
    } else if (data?.user) {
      // Wait for trigger to create profile row, then force-update user_type
      await new Promise((r) => setTimeout(r, 500))

      // Use admin client to guarantee the update (bypasses RLS)
      const admin = createAdminClient()
      const { error: profileError } = await admin
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            full_name: fullName,
            user_type: userType,
          },
          { onConflict: "id" }
        )

      console.log(
        "[signUp] profile upsert result:",
        profileError?.message ?? "success"
      )
    }
  } catch {
    errorMessage = "An unexpected error occurred."
  }

  if (errorMessage) {
    return { error: errorMessage }
  }

  redirect(userType === "homeowner" ? "/homeowner/dashboard" : "/dashboard")
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function deleteAccount(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  // Sign out first to clear the session
  await supabase.auth.signOut()

  // Use admin client to delete user — cascades to all related data
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) return { error: error.message }
  return { error: null }
}
