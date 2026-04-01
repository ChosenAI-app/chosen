import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export default async function MarketplaceLayout({
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

  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there"

  const dashboardLink =
    profile?.user_type === "homeowner"
      ? "/homeowner/dashboard"
      : "/dashboard"

  const roleLabel =
    profile?.user_type === "homeowner"
      ? "Homeowner"
      : profile?.user_type === "architect"
        ? "Architect"
        : profile?.user_type === "engineer"
          ? "Engineer"
          : profile?.user_type === "inspector"
            ? "Inspector"
            : "Contractor"

  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-0.5 w-full bg-primary" />
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href={dashboardLink}
            className="text-xs font-bold tracking-[0.25em] text-foreground"
          >
            CHOSEN
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="hidden text-xs text-muted-foreground hover:text-foreground sm:block"
            >
              Marketplace
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {firstName}
            </span>
            <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {roleLabel}
            </span>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-muted-foreground hover:text-foreground"
              >
                Sign out
              </Button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}
