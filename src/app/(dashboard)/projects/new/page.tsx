"use client"

import { useTransition, useState, useEffect, useRef } from "react"
import { createProject } from "@/lib/actions/projects"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any
  }
}

const PROJECT_TYPES = [
  { value: "adu_detached", label: "Detached ADU" },
  { value: "adu_attached", label: "Attached ADU / JADU" },
  { value: "addition", label: "Residential Addition" },
  { value: "remodel", label: "Interior Remodel" },
] as const

export default function NewProjectPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<1 | 2>(1)

  const [step1Data, setStep1Data] = useState({
    address: "",
    project_type: "",
    scope_description: "",
  })

  const [intakeAnswers, setIntakeAnswers] = useState({
    fireSprinklersExist: false,
    hasEarthwork: false,
  })

  // Refs for Places data
  const selectedAddressRef = useRef("")
  const selectedZipRef = useRef("")
  const selectedCityRef = useRef("")
  const selectedLatRef = useRef("")
  const selectedLngRef = useRef("")

  // Google Places PlaceAutocompleteElement
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    let attempts = 0
    const MAX_ATTEMPTS = 100

    function init(): boolean {
      if (!window.google?.maps?.places?.PlaceAutocompleteElement) return false
      const container = document.getElementById("contractor-place-container")
      if (!container || container.children.length > 0) return true

      const el = new window.google.maps.places.PlaceAutocompleteElement({
        componentRestrictions: { country: "us" },
        types: ["address"],
      })
      el.style.width = "100%"
      container.appendChild(el)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async function handlePlace(event: any, name: string) {
        console.log(`[Places] ${name} fired`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let place: any
        if (event.placePrediction) {
          place = event.placePrediction.toPlace()
        } else if (event.place) {
          place = event.place
        } else {
          return
        }
        await place.fetchFields({
          fields: ["formattedAddress", "location", "addressComponents"],
        })
        if (place.formattedAddress) {
          setStep1Data((d) => ({ ...d, address: place.formattedAddress }))
          selectedAddressRef.current = place.formattedAddress
        }
        if (place.location) {
          selectedLatRef.current = place.location.lat().toString()
          selectedLngRef.current = place.location.lng().toString()
        }
        if (place.addressComponents) {
          for (const c of place.addressComponents) {
            if (c.types?.includes("postal_code"))
              selectedZipRef.current = c.longText
            if (c.types?.includes("locality"))
              selectedCityRef.current = c.longText
          }
        }
      }

      el.addEventListener("gmp-placeselect", (e: Event) =>
        handlePlace(e, "gmp-placeselect")
      )
      el.addEventListener("gmp-select", (e: Event) =>
        handlePlace(e, "gmp-select")
      )
      return true
    }

    if (init()) return
    interval = setInterval(() => {
      attempts++
      if (init() || attempts >= MAX_ATTEMPTS) {
        if (interval) clearInterval(interval)
      }
    }, 100)
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  function handleNext() {
    setError(null)
    const addr = selectedAddressRef.current || step1Data.address.trim()
    if (!addr) {
      setError("Please select an address from the dropdown.")
      return
    }
    if (selectedCityRef.current && selectedCityRef.current !== "Palo Alto") {
      setError(
        "Chosen currently serves Palo Alto only. Support for more cities coming soon."
      )
      return
    }
    if (!step1Data.project_type) {
      setError("Please select a project type.")
      return
    }
    setStep(2)
  }

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append("address", selectedAddressRef.current || step1Data.address)
      if (selectedZipRef.current) fd.append("zip_code", selectedZipRef.current)
      fd.append("project_type", step1Data.project_type)
      fd.append("scope_description", step1Data.scope_description)
      fd.append(
        "fireSprinklersExist",
        intakeAnswers.fireSprinklersExist ? "yes" : "no"
      )
      fd.append("hasEarthwork", intakeAnswers.hasEarthwork ? "yes" : "no")
      if (selectedLatRef.current) fd.append("lat", selectedLatRef.current)
      if (selectedLngRef.current) fd.append("lng", selectedLngRef.current)

      const result = await createProject(fd)
      if (result?.error) {
        setError(result.error)
      }
    })
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
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Street address
                </Label>
                <div
                  id="contractor-place-container"
                  className="[&>*]:w-full [&>*]:rounded-md [&>*]:border [&>*]:border-input [&>*]:bg-background [&>*]:px-3 [&>*]:py-2 [&>*]:text-sm [&>*]:text-foreground"
                />
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
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Scope description{" "}
                  <span className="normal-case tracking-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
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
                className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setError(null)
                    setStep(1)
                  }}
                >
                  &larr; Back
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
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
  )
}

function YesNoToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
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
  )
}

function IntakeQuestions({
  projectType,
  answers,
  onChange,
}: {
  projectType: string
  answers: { fireSprinklersExist: boolean; hasEarthwork: boolean }
  onChange: (a: typeof answers) => void
}) {
  if (projectType === "adu_detached") {
    return (
      <div className="flex flex-col gap-3">
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
    )
  }

  if (projectType === "adu_attached") {
    return (
      <div className="flex flex-col gap-3">
        <YesNoToggle
          label="Will the project involve earthwork or drainage changes?"
          value={answers.hasEarthwork}
          onChange={(v) => onChange({ ...answers, hasEarthwork: v })}
        />
      </div>
    )
  }

  if (projectType === "addition") {
    return (
      <div className="flex flex-col gap-3">
        <YesNoToggle
          label="Will the project involve earthwork or significant grading?"
          value={answers.hasEarthwork}
          onChange={(v) => onChange({ ...answers, hasEarthwork: v })}
        />
      </div>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      No additional permits required beyond Building and Electrical. You&apos;re
      ready to create your project.
    </p>
  )
}
