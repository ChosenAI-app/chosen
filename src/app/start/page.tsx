"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import { createHomeownerProject } from "@/lib/actions/homeowner-projects"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any
  }
}

const PROJECT_TYPES = [
  { value: "adu_detached", label: "Detached ADU" },
  { value: "adu_attached", label: "Attached ADU" },
  { value: "jadu", label: "Junior ADU (JADU)" },
  { value: "addition", label: "Residential Addition" },
  { value: "remodel", label: "Interior Remodel" },
] as const

export default function StartPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Step 1 fields
  const [address, setAddress] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [placeCity, setPlaceCity] = useState("")
  const [projectType, setProjectType] = useState("")
  const [description, setDescription] = useState("")

  // Google Places lat/lng
  const [placeLat, setPlaceLat] = useState("")
  const [placeLng, setPlaceLng] = useState("")

  // Step 2 fields
  const [fireWestOf280, setFireWestOf280] = useState<"yes" | "no" | "">("")
  const [fireSprinklersExist, setFireSprinklersExist] = useState<
    "yes" | "no" | ""
  >("")
  const [hasEarthwork, setHasEarthwork] = useState<"yes" | "no" | "">("")

  // Google Places PlaceAutocompleteElement setup
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    let attempts = 0
    const MAX_ATTEMPTS = 100

    function initPlaceAutocomplete(): boolean {
      if (!window.google?.maps?.places?.PlaceAutocompleteElement) return false

      const container = document.getElementById("place-autocomplete-container")
      if (!container || container.children.length > 0) return true

      const placeAutocomplete =
        new window.google.maps.places.PlaceAutocompleteElement({
          componentRestrictions: { country: "us" },
          types: ["address"],
        })

      placeAutocomplete.style.width = "100%"
      container.appendChild(placeAutocomplete)

      placeAutocomplete.addEventListener(
        "gmp-placeselect",
        async (event: Event) => {
          const placeEvent = event as CustomEvent & {
            place: {
              fetchFields: (opts: { fields: string[] }) => Promise<void>
              formattedAddress?: string
              location?: { lat: () => number; lng: () => number }
              addressComponents?: Array<{
                types: string[]
                longText: string
              }>
            }
          }

          const place = placeEvent.place

          await place.fetchFields({
            fields: ["formattedAddress", "location", "addressComponents"],
          })

          if (place.formattedAddress) {
            setAddress(place.formattedAddress)
          }

          if (place.location) {
            setPlaceLat(place.location.lat().toString())
            setPlaceLng(place.location.lng().toString())
          }

          if (place.addressComponents) {
            for (const component of place.addressComponents) {
              if (component.types?.includes("postal_code")) {
                setZipCode(component.longText)
              }
              if (component.types?.includes("locality")) {
                setPlaceCity(component.longText)
              }
            }
          }
        }
      )

      return true
    }

    if (initPlaceAutocomplete()) return

    interval = setInterval(() => {
      attempts++
      if (initPlaceAutocomplete() || attempts >= MAX_ATTEMPTS) {
        if (interval) clearInterval(interval)
      }
    }, 100)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  function handleNext() {
    setError(null)

    if (!address.trim()) {
      setError("Please select an address from the dropdown above.")
      return
    }

    if (!placeCity) {
      setError("Please select an address from the dropdown above.")
      return
    }

    if (placeCity !== "Palo Alto") {
      setError(
        "Chosen currently serves Palo Alto only. Support for more cities coming soon."
      )
      return
    }

    if (!projectType) {
      setError("Please select a project type.")
      return
    }

    setStep(2)
  }

  function handleSubmit() {
    setError(null)

    if (!fireWestOf280 || !fireSprinklersExist || !hasEarthwork) {
      setError("Please answer all questions.")
      return
    }

    const formData = new FormData()
    formData.set("address", address.trim())
    if (zipCode) formData.set("zip_code", zipCode)
    formData.set("project_type", projectType)
    if (description.trim()) {
      formData.set("description", description.trim())
    }
    formData.set("fire_west_of_280", fireWestOf280)
    formData.set("fire_sprinklers_exist", fireSprinklersExist)
    formData.set("has_earthwork", hasEarthwork)
    if (placeLat) formData.set("lat", placeLat)
    if (placeLng) formData.set("lng", placeLng)

    startTransition(async () => {
      const result = await createHomeownerProject(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Amber accent line */}
      <div className="h-0.5 w-full bg-primary" />

      <header className="border-b border-border bg-card/50">
        <nav className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link
            href="/"
            className="text-xs font-bold tracking-[0.25em] text-foreground"
          >
            CHOSEN
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Progress indicator */}
          <div className="mb-8 flex items-center gap-3">
            <div
              className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-border"}`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-border"}`}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            {step === 1 && (
              <>
                <h1 className="text-xl font-bold tracking-tight">
                  Tell us about your project
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We&apos;ll generate an AI-powered project plan with permits,
                  costs, and timeline.
                </p>

                <div className="mt-6 flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Street address
                    </Label>
                    <div
                      id="place-autocomplete-container"
                      className="mt-1.5 [&>*]:w-full [&>*]:rounded-md [&>*]:border [&>*]:border-input [&>*]:bg-background [&>*]:px-3 [&>*]:py-2 [&>*]:text-sm [&>*]:text-foreground"
                    />
                    <input type="hidden" name="address" value={address} />
                  </div>

                  <div>
                    <Label htmlFor="project_type">Project type</Label>
                    <Select value={projectType} onValueChange={setProjectType}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select a project type" />
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

                  <div>
                    <Label htmlFor="description">
                      Scope description{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what you're planning — size, features, special requirements..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {error && (
                  <p className="mt-4 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleNext}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Next
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-xl font-bold tracking-tight">
                  A few more details
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  These determine which permits your project requires.
                </p>

                <div className="mt-6 flex flex-col gap-6">
                  <fieldset>
                    <legend className="text-sm font-medium text-foreground">
                      Is the property west of Highway 280?
                    </legend>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      This triggers a Palo Alto Fire Department review.
                    </p>
                    <div className="mt-2 flex gap-3">
                      <Button
                        type="button"
                        variant={
                          fireWestOf280 === "yes" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setFireWestOf280("yes")}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={fireWestOf280 === "no" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFireWestOf280("no")}
                      >
                        No
                      </Button>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-sm font-medium text-foreground">
                      Does the main house have fire sprinklers?
                    </legend>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      If so, the ADU may also require sprinklers.
                    </p>
                    <div className="mt-2 flex gap-3">
                      <Button
                        type="button"
                        variant={
                          fireSprinklersExist === "yes" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setFireSprinklersExist("yes")}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={
                          fireSprinklersExist === "no" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setFireSprinklersExist("no")}
                      >
                        No
                      </Button>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-sm font-medium text-foreground">
                      Does the project involve earthwork or grading?
                    </legend>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Triggers a Grading and Drainage Plan requirement.
                    </p>
                    <div className="mt-2 flex gap-3">
                      <Button
                        type="button"
                        variant={
                          hasEarthwork === "yes" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setHasEarthwork("yes")}
                      >
                        Yes
                      </Button>
                      <Button
                        type="button"
                        variant={hasEarthwork === "no" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setHasEarthwork("no")}
                      >
                        No
                      </Button>
                    </div>
                  </fieldset>
                </div>

                {error && (
                  <p className="mt-4 text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setError(null)
                      setStep(1)
                    }}
                  >
                    <ArrowLeft className="mr-1.5 size-3.5" />
                    Back
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Generate My Project Plan"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
