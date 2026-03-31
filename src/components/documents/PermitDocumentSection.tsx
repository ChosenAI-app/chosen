import { createClient } from "@/lib/supabase/server";
import { DocumentChecklistItem } from "@/components/documents/DocumentChecklistItem";
import { Badge } from "@/components/ui/badge";
import { getStatusVariant, getStatusLabel } from "@/lib/utils/status";
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

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium">{permitTypeName}</h2>
        <Badge variant={getStatusVariant(permitStatus)}>
          {getStatusLabel(permitStatus)}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
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
