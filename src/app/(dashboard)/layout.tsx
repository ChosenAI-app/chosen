import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GlobalNav } from "@/components/shared/GlobalNav"
import { CesiumScriptLoader } from "@/components/homeowner/CesiumScriptLoader"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function DashboardLayout({
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

  // Redirect homeowners to their dashboard
  if (profile?.user_type === "homeowner") {
    redirect("/homeowner/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <GlobalNav user={user} profile={profile} />
      {/* Contractor-specific sub-nav */}
      <div className="border-b border-border/50 bg-card/50">
        <div className="mx-auto flex h-10 max-w-6xl items-center justify-end px-4">
          <Button
            asChild
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/projects/new">
              <Plus className="mr-1.5 size-3.5" />
              New Project
            </Link>
          </Button>
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <CesiumScriptLoader />
    </div>
  )
}
