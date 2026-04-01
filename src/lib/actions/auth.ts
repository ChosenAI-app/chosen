"use server"

import { createClient } from "@/lib/supabase/server"
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

  let errorMessage: string | null = null

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, user_type: userType },
      },
    })
    if (error) {
      errorMessage = error.message
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
