import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getUserRole, canViewInspections } from "@/lib/utils/permissions";
import type { InspectionStep } from "@/lib/types";

export default async function InspectionsPage({
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
  if (!role || !canViewInspections(role)) {
    notFound();
  }

  const { data: project } = await supabase
    .from("projects")
    .select("address")
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  const { data: permitData } = await supabase
    .from("project_permits")
    .select("permit_type_id, permit_types!inner(id, name)")
    .eq("project_id", id)
    .eq("permit_types.name", "Building Permit")
    .maybeSingle();

  if (!permitData) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <ArrowLeft className="size-3" />
            Back to project
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight">
            Inspection Sequence &mdash; {project.address}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          No inspection sequence available for this project type.
        </p>
      </div>
    );
  }

  const { data: stepsData } = await supabase
    .from("inspection_steps")
    .select("*")
    .eq("permit_type_id", permitData.permit_type_id)
    .order("display_order", { ascending: true });

  const steps = (stepsData ?? []) as InspectionStep[];

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
          Inspection Sequence &mdash; {project.address}
        </h1>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No inspection steps found.
        </p>
      ) : (
        <div className="relative ml-4">
          {/* Vertical timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

          <div className="flex flex-col gap-0">
            {steps.map((step, index) => {
              const isCO = step.name === "Certificate of Occupancy";
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={step.id}
                  className={`relative flex gap-5 ${isLast ? "pb-0" : "pb-8"}`}
                >
                  {/* Timeline node */}
                  <div className="relative z-10 flex shrink-0">
                    <div
                      className={`mt-0.5 flex size-6 items-center justify-center rounded-full border-2 ${
                        isCO
                          ? "border-green-500 bg-green-500/20"
                          : "border-border bg-card"
                      }`}
                    >
                      {isCO ? (
                        <div className="size-2 rounded-full bg-green-400" />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {step.display_order}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step content */}
                  <div className={`flex-1 ${isCO ? "pb-1" : ""}`}>
                    {isCO && (
                      <span className="mb-1 inline-block text-[10px] font-semibold uppercase tracking-widest text-green-400">
                        Final Step
                      </span>
                    )}
                    <p className="font-medium text-foreground leading-tight">
                      {step.name}
                    </p>
                    {step.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    )}
                    {step.prerequisite_ids.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground/70 italic">
                        Requires prior inspections to pass
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
