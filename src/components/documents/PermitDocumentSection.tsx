import { createClient } from "@/lib/supabase/server";
import { DocumentChecklistItem } from "@/components/documents/DocumentChecklistItem";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProjectRole } from "@/lib/utils/permissions";
import type { PermitRequirement, ProjectDocument } from "@/lib/types";

interface PermitDocumentSectionProps {
  projectId: string;
  permitTypeId: string;
  permitTypeName: string;
  permitStatus: string;
  userRole: ProjectRole;
}

export async function PermitDocumentSection({
  projectId,
  permitTypeId,
  permitTypeName,
  permitStatus,
  userRole,
}: PermitDocumentSectionProps) {
  const supabase = await createClient();

  const [reqResult, docResult] = await Promise.all([
    supabase
      .from("permit_requirements")
      .select("*")
      .eq("permit_type_id", permitTypeId)
      .order("display_order", { ascending: true }),
    supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", projectId),
  ]);

  const requirements = (reqResult.data ?? []) as PermitRequirement[];
  const allDocs = (docResult.data ?? []) as ProjectDocument[];

  if (requirements.length === 0) {
    return null;
  }

  const requirementIds = new Set(requirements.map((r) => r.id));
  const relevantDocs = allDocs.filter((d) =>
    requirementIds.has(d.permit_requirement_id)
  );

  const docsByRequirement = new Map<string, ProjectDocument>();
  for (const doc of relevantDocs) {
    docsByRequirement.set(doc.permit_requirement_id, doc);
  }

  const uploadedCount = requirements.filter((r) =>
    docsByRequirement.has(r.id)
  ).length;

  return (
    <section className="rounded-md border border-border bg-card">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
        <div className="flex items-center gap-3">
          <h2 className="font-medium text-foreground">{permitTypeName}</h2>
          <StatusBadge status={permitStatus} />
        </div>
        <span className="text-xs text-muted-foreground">
          {uploadedCount}/{requirements.length} docs
        </span>
      </div>

      {/* Document rows */}
      <div className="divide-y divide-border/50">
        {requirements.map((req) => (
          <DocumentChecklistItem
            key={req.id}
            projectId={projectId}
            requirement={req}
            uploadedDoc={docsByRequirement.get(req.id) ?? null}
            userRole={userRole}
          />
        ))}
      </div>
    </section>
  );
}
