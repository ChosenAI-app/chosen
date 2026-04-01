import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlobalNav } from "@/components/shared/GlobalNav"

export default async function InvitationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="flex min-h-screen flex-col">
      <GlobalNav user={user} profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}
