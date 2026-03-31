"use client";

import { useTransition, useState } from "react";
import { createProject } from "@/lib/actions/projects";
import { isPaloAltoZip, normalizeZip } from "@/lib/utils/jurisdiction";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-muted-foreground">
            Step {step} of 2
          </p>

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Street address</Label>
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
                <Label htmlFor="zip_code">Zip code</Label>
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
                <Label>Project type</Label>
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
                <Label htmlFor="scope_description">
                  Scope description{" "}
                  <span className="font-normal text-muted-foreground">
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

              <Button onClick={handleNext}>Next &rarr;</Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <IntakeQuestions
                projectType={step1Data.project_type}
                answers={intakeAnswers}
                onChange={setIntakeAnswers}
              />

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                >
                  &larr; Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isPending}
                >
                  {isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={value ? "default" : "outline"}
          onClick={() => onChange(true)}
        >
          Yes
        </Button>
        <Button
          type="button"
          size="sm"
          variant={!value ? "default" : "outline"}
          onClick={() => onChange(false)}
        >
          No
        </Button>
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
      <div className="flex flex-col gap-4">
        <YesNoToggle
          label="Is any part of the property west of Highway 280?"
          value={answers.fireWestOf280}
          onChange={(v) => onChange({ ...answers, fireWestOf280: v })}
        />
        <YesNoToggle
          label="Does the main house on the property have fire sprinklers?"
          value={answers.fireSprinklersExist}
          onChange={(v) => onChange({ ...answers, fireSprinklersExist: v })}
        />
        <YesNoToggle
          label="Will the project involve earthwork, grading, or drainage changes?"
          value={answers.hasEarthwork}
          onChange={(v) => onChange({ ...answers, hasEarthwork: v })}
        />
      </div>
    );
  }

  if (projectType === "adu_attached") {
    return (
      <div className="flex flex-col gap-4">
        <YesNoToggle
          label="Will the project involve earthwork, grading, or drainage changes?"
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
      <div className="flex flex-col gap-4">
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
