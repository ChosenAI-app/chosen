import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PermitDocumentSection } from "@/components/documents/PermitDocumentSection";
import { getUserRole, canViewDocuments } from "@/lib/utils/permissions";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const role = await getUserRole(user.id, id, supabase);
  if (!role || !canViewDocuments(role)) {
    notFound();
  }

  let { data: project } = await supabase
    .from("projects")
    .select("address")
    .eq("id", id)
    .maybeSingle();

  // Fallback for team members if RLS blocks
  if (!project) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: adminProject } = await admin
      .from("projects")
      .select("address")
      .eq("id", id)
      .maybeSingle();
    project = adminProject;
  }

  if (!project) {
    notFound();
  }

  const { data: permits } = await supabase
    .from("project_permits")
    .select("*, permit_types!inner(id, name)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150"
        >
          <ArrowLeft className="size-3" />
          Back to project
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight">
          Documents &mdash; {project.address}
        </h1>
      </div>

      {permits && permits.length > 0 ? (
        permits.map((permit) => {
          const permitType = permit.permit_types as {
            id: string;
            name: string;
          };

          return (
            <PermitDocumentSection
              key={permit.id}
              projectId={id}
              permitTypeId={permitType.id}
              permitTypeName={permitType.name}
              permitStatus={permit.status}
              userRole={role}
            />
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground">
          No permits found for this project.
        </p>
      )}
    </div>
  );
}
