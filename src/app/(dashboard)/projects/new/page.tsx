"use client";

import { useTransition, useState } from "react";
import { createProject } from "@/lib/actions/projects";
import { isPaloAltoZip, normalizeZip } from "@/lib/utils/jurisdiction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PROJECT_TYPES = [
  { value: "adu_detached", label: "Detached ADU" },
  { value: "adu_attached", label: "Attached ADU / JADU" },
  { value: "addition", label: "Residential Addition" },
  { value: "remodel", label: "Interior Remodel" },
] as const;

export default function NewProjectPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);

  const [step1Data, setStep1Data] = useState({
    address: "",
    zip_code: "",
    project_type: "",
    scope_description: "",
  });

  const [intakeAnswers, setIntakeAnswers] = useState({
    fireWestOf280: false,
    fireSprinklersExist: false,
    hasEarthwork: false,
  });

  function handleNext() {
    setError(null);

    if (!step1Data.address.trim()) {
      setError("Street address is required.");
      return;
    }
    if (!step1Data.zip_code.trim()) {
      setError("Zip code is required.");
      return;
    }
    if (!isPaloAltoZip(normalizeZip(step1Data.zip_code))) {
      setError(
        "Chosen currently supports Palo Alto only (94301, 94303, 94304, 94306)."
      );
      return;
    }
    if (!step1Data.project_type) {
      setError("Please select a project type.");
      return;
    }

    setStep(2);
  }

  function handleSubmit() {
    setError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("address", step1Data.address);
      fd.append("zip_code", step1Data.zip_code);
      fd.append("project_type", step1Data.project_type);
      fd.append("scope_description", step1Data.scope_description);
      fd.append("fireWestOf280", intakeAnswers.fireWestOf280 ? "yes" : "no");
      fd.append(
        "fireSprinklersExist",
        intakeAnswers.fireSprinklersExist ? "yes" : "no"
      );
      fd.append("hasEarthwork", intakeAnswers.hasEarthwork ? "yes" : "no");

      const result = await createProject(fd);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-lg">
        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-0">
          <div
            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-150 ${
              step >= 1
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            1
          </div>
          <div
            className={`h-px w-16 transition-all duration-150 ${
              step >= 2 ? "bg-primary" : "bg-border"
            }`}
          />
          <div
            className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-150 ${
              step >= 2
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            2
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-6">
          <h1 className="text-xl font-bold tracking-tight">New Project</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Step {step} of 2 &mdash;{" "}
            {step === 1 ? "Project details" : "Additional questions"}
          </p>

          <div className="section-divider" />

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="address"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Street address
                </Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Main St"
                  required
                  value={step1Data.address}
                  onChange={(e) =>
                    setStep1Data((d) => ({ ...d, address: e.target.value }))
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="zip_code"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Zip code
                </Label>
                <Input
                  id="zip_code"
                  type="text"
                  inputMode="numeric"
                  placeholder="94301"
                  required
                  value={step1Data.zip_code}
                  onChange={(e) =>
                    setStep1Data((d) => ({ ...d, zip_code: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Palo Alto only: 94301, 94303, 94304, 94306
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Project type
                </Label>
                <Select
                  value={step1Data.project_type}
                  onValueChange={(v) =>
                    setStep1Data((d) => ({ ...d, project_type: v }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="scope_description"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Scope description{" "}
                  <span className="normal-case tracking-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="scope_description"
                  placeholder="Brief description of the project scope..."
                  value={step1Data.scope_description}
                  onChange={(e) =>
                    setStep1Data((d) => ({
                      ...d,
                      scope_description: e.target.value,
                    }))
                  }
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                onClick={handleNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150"
              >
                Next &rarr;
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <IntakeQuestions
                projectType={step1Data.project_type}
                answers={intakeAnswers}
                onChange={setIntakeAnswers}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground transition-all duration-150"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                >
                  &larr; Back
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background p-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex shrink-0 gap-1.5">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`rounded-sm px-3 py-1 text-xs font-semibold transition-all duration-150 ${
            value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`rounded-sm px-3 py-1 text-xs font-semibold transition-all duration-150 ${
            !value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

function IntakeQuestions({
  projectType,
  answers,
  onChange,
}: {
  projectType: string;
  answers: { fireWestOf280: boolean; fireSprinklersExist: boolean; hasEarthwork: boolean };
  onChange: (a: typeof answers) => void;
}) {
  if (projectType === "adu_detached") {
    return (
      <div className="flex flex-col gap-3">
        <YesNoToggle
          label="Is any part of the property west of Highway 280?"
          value={answers.fireWestOf280}
          onChange={(v) => onChange({ ...answers, fireWestOf280: v })}
        />
        <YesNoToggle
          label="Does the main house have fire sprinklers?"
          value={answers.fireSprinklersExist}
          onChange={(v) => onChange({ ...answers, fireSprinklersExist: v })}
        />
        <YesNoToggle
          label="Will the project involve earthwork or drainage changes?"
          value={answers.hasEarthwork}
          onChange={(v) => onChange({ ...answers, hasEarthwork: v })}
        />
      </div>
    );
  }

  if (projectType === "adu_attached") {
    return (
      <div className="flex flex-col gap-3">
        <YesNoToggle
          label="Will the project involve earthwork or drainage changes?"
          value={answers.hasEarthwork}
          onChange={(v) => onChange({ ...answers, hasEarthwork: v })}
        />
        <p className="text-xs text-muted-foreground">
          JADU Deed Restriction will be included automatically.
        </p>
      </div>
    );
  }

  if (projectType === "addition") {
    return (
      <div className="flex flex-col gap-3">
        <YesNoToggle
          label="Will the project involve earthwork or significant grading?"
          value={answers.hasEarthwork}
          onChange={(v) => onChange({ ...answers, hasEarthwork: v })}
        />
        <p className="text-xs text-muted-foreground">
          School District Fee Certificate will be included automatically.
        </p>
      </div>
    );
  }

  // remodel
  return (
    <p className="text-sm text-muted-foreground">
      No additional permits required beyond Building and Electrical.
      You&apos;re ready to create your project.
    </p>
  );
}
