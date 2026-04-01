import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

interface GlobalNavProps {
  user: { email?: string; id: string }
  profile: {
    full_name: string | null
    user_type: string | null
  } | null
}

export async function GlobalNav({ user, profile }: GlobalNavProps) {
  const userType = profile?.user_type ?? "homeowner"
  const isHomeowner = userType === "homeowner"

  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there"

  const projectsLink = isHomeowner ? "/homeowner/dashboard" : "/dashboard"
  const settingsLink = isHomeowner ? "/homeowner/settings" : "/settings"

  // Fetch pending invite count
  let pendingInviteCount = 0
  if (user.email) {
    const supabase = await createClient()
    const { count } = await supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("invited_email", user.email)
      .eq("invite_status", "pending")
    pendingInviteCount = count ?? 0
  }

  return (
    <>
      <div className="h-0.5 w-full bg-primary" />
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-xs font-bold tracking-[0.25em] text-foreground"
          >
            CHOSEN
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={projectsLink}
              className="hidden text-xs text-muted-foreground hover:text-foreground sm:block"
            >
              My Projects
            </Link>
            <Link
              href="/marketplace"
              className="hidden text-xs text-muted-foreground hover:text-foreground sm:block"
            >
              Marketplace
            </Link>
            <Link
              href="/invitations"
              className="relative hidden text-xs text-muted-foreground hover:text-foreground sm:block"
            >
              Invitations
              {pendingInviteCount > 0 && (
                <span className="absolute -right-3 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {pendingInviteCount}
                </span>
              )}
            </Link>
            <Link
              href={settingsLink}
              className="hidden text-xs font-medium text-primary hover:underline sm:block"
            >
              {firstName}
            </Link>
            <form action={signOut}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="text-muted-foreground hover:text-foreground transition-all duration-150"
              >
                Sign out
              </Button>
            </form>
          </div>
        </nav>
      </header>
    </>
  )
}
