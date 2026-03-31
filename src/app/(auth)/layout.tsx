import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden flex-col justify-between border-r border-border bg-card p-10 lg:flex lg:w-1/2">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-foreground">
            CHOSEN
          </p>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground">
            The permit OS for
            <br />
            residential construction.
          </h1>
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Auto-generate permit workflows for your jurisdiction
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Track documents, inspections, and team in one place
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Built for Palo Alto contractors who need precision
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/50">
          &copy; {new Date().getFullYear()} Chosen
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-background px-4">
        {children}
      </div>
    </div>
  );
}
