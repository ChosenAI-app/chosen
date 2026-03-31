import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { Project, InspectionStep } from "@/lib/types";

export default async function InspectionsPage({
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

  // Find Building Permit for this project
  const { data: permitData } = await supabase
    .from("project_permits")
    .select("permit_type_id, permit_types!inner(id, name)")
    .eq("project_id", id)
    .eq("permit_types.name", "Building Permit")
    .maybeSingle();

  if (!permitData) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Inspection Sequence &mdash; {project.address}
        </h1>
        <p className="text-sm text-muted-foreground">
          No inspection sequence available for this project type.
        </p>
      </div>
    );
  }

  // Fetch inspection steps
  const { data: stepsData } = await supabase
    .from("inspection_steps")
    .select("*")
    .eq("permit_type_id", permitData.permit_type_id)
    .order("display_order", { ascending: true });

  const steps = (stepsData ?? []) as InspectionStep[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Inspection Sequence &mdash; {project.address}
      </h1>

      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No inspection steps found.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {steps.map((step) => {
            const isCO = step.name === "Certificate of Occupancy";

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 rounded-lg border px-4 py-3 ${
                  isCO
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                    : ""
                }`}
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {isCO ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    step.display_order
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{step.name}</p>
                    {isCO && (
                      <span className="text-xs text-green-600">Final step</span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  )}
                  {step.prerequisite_ids.length > 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Requires prior steps
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
