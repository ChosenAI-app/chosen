import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlobalNav } from "@/components/shared/GlobalNav"
import { CesiumScriptLoader } from "@/components/homeowner/CesiumScriptLoader"

export default async function HomeownerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .maybeSingle()

  // Redirect professionals to contractor dashboard
  if (
    profile?.user_type &&
    ["contractor", "architect", "engineer", "inspector"].includes(
      profile.user_type
    )
  ) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GlobalNav user={user} profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <CesiumScriptLoader />
    </div>
  )
}
