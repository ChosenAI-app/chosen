import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome, {user?.email}
      </h1>
      <p className="mt-2 text-muted-foreground">
        No projects yet.{" "}
        <Link
          href="/projects/new"
          className="text-foreground underline underline-offset-4"
        >
          Create your first project.
        </Link>
      </p>
    </div>
  );
}
