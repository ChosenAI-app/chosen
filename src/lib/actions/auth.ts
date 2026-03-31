"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      errorMessage = error.message;
    }
  } catch {
    errorMessage = "An unexpected error occurred.";
  }

  if (errorMessage) {
    return { error: errorMessage };
  }

  redirect("/dashboard");
}

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) {
      errorMessage = error.message;
    }
  } catch {
    errorMessage = "An unexpected error occurred.";
  }

  if (errorMessage) {
    return { error: errorMessage };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
