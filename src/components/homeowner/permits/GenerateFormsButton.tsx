"use client"

import { useTransition } from "react"
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
  const router = useRouter()

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateFormFills(projectId)
      if (result.error) {
        alert(`Error: ${result.error}`)
      } else {
        router.refresh()
      }
    })
  }

  return (
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
  )
}
