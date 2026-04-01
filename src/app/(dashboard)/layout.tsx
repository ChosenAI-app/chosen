import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, user_type")
    .eq("id", user.id)
    .maybeSingle();

  // Redirect homeowners to their dashboard
  if (profile?.user_type === "homeowner") {
    redirect("/homeowner/dashboard");
  }

  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Amber accent line */}
      <div className="h-0.5 w-full bg-primary" />
      <header className="border-b border-border bg-card">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/dashboard"
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
            <Link
              href="/settings"
              className="hidden text-xs text-muted-foreground hover:text-foreground sm:block"
            >
              Settings
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {firstName}
            </span>
            <Button
              asChild
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150"
            >
              <Link href="/projects/new">
                <Plus className="mr-1.5 size-3.5" />
                New Project
              </Link>
            </Button>
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
