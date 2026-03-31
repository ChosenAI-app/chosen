import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PermitDocumentSection } from "@/components/documents/PermitDocumentSection";
import type { Project } from "@/lib/types";

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Fetch project
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project || (project as unknown as Project).user_id !== user.id) {
    notFound();
  }

  // Fetch permits with permit type info
  const { data: permits } = await supabase
    .from("project_permits")
    .select("*, permit_types!inner(id, name)")
    .eq("project_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Documents &mdash; {project.address}
      </h1>

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
