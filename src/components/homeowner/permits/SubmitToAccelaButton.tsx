"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  submitToAccela,
  ACCELA_CERTIFICATION_TEXT,
} from "@/lib/actions/accela-submit"
import {
  Loader2,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

export function SubmitToAccelaButton({
  projectId,
}: {
  projectId: string
}) {
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permitNumber, setPermitNumber] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (permitNumber) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-green-900/50 bg-green-950/20 p-6 text-center">
        <CheckCircle2 className="size-10 text-green-400" />
        <h3 className="text-lg font-bold text-green-400">
          Submitted to City of Palo Alto
        </h3>
        <div className="rounded-md bg-black/30 px-4 py-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Permit Record Number
          </p>
          <p className="mt-1 font-mono text-xl font-bold">{permitNumber}</p>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Plan check typically takes 6–10 weeks. You&apos;ll receive email
          updates as the city processes your application.
        </p>
      </div>
    )
  }

  function handleSubmit() {
    if (!agreed) return
    setError(null)
    startTransition(async () => {
      const result = await submitToAccela(projectId, agreed)
      if (result.error) {
        setError(result.error)
      } else {
        setPermitNumber(result.permitNumber ?? "Submitted")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-primary/20 bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="size-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold">Submit to City of Palo Alto</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Chosen will submit your permit application directly to the city
            via the Accela permitting portal.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-md bg-muted/30 p-4 text-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What happens next
        </p>
        {[
          "Your pre-filled forms are packaged into a PDF",
          "Chosen submits to aca-prod.accela.com/PALOALTO",
          "You receive a permit record number immediately",
          "City reviews your plans — 6–10 weeks for ADUs",
          "Chosen notifies you of corrections or approvals",
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-0.5 text-xs font-bold text-primary">
              {i + 1}
            </span>
            <span className="text-muted-foreground">{step}</span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Certification Required
        </p>
        <p className="text-sm italic leading-relaxed text-foreground">
          &quot;{ACCELA_CERTIFICATION_TEXT}&quot;
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="text-sm font-medium">
            I certify the above statement and authorize Chosen to submit
            this application on my behalf to the City of Palo Alto.
          </span>
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        onClick={handleSubmit}
        disabled={!agreed || pending}
        size="lg"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Submitting to City of Palo Alto...
          </>
        ) : (
          <>
            <Building2 className="mr-2 size-4" />
            Submit Permit Application
          </>
        )}
      </Button>

      {!agreed && (
        <p className="text-center text-xs text-muted-foreground">
          You must certify the statement above before submitting
        </p>
      )}
    </div>
  )
}
