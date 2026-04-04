"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { generateFormFills } from "@/lib/actions/permit-forms"
import { Loader2, Sparkles } from "lucide-react"

export function GenerateFormsButton({
  projectId,
  label = "Generate Permit Package",
}: {
  projectId: string
  label?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await generateFormFills(projectId)
        if (result.error) {
          console.error("[GenerateFormsButton] Error:", result.error)
          setError(result.error)
        } else {
          router.refresh()
        }
      } catch (err) {
        console.error("[GenerateFormsButton] Uncaught:", err)
        setError("An unexpected error occurred. Check the console.")
      }
    })
  }

  return (
    <div>
      <Button
        onClick={handleGenerate}
        disabled={pending}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generating forms...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 size-4" />
            {label}
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-center text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
