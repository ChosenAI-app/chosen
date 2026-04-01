"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { submitBid } from "@/lib/actions/bids"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const ROLES = [
  { value: "contractor", label: "General Contractor" },
  { value: "architect", label: "Architect" },
  { value: "engineer", label: "Structural Engineer" },
]

export function BidForm({
  projectId,
  userType,
}: {
  projectId: string
  userType: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(userType || "contractor")
  const [coverLetter, setCoverLetter] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("projectId", projectId)
    formData.set("bidder_role", role)

    startTransition(async () => {
      const result = await submitBid(formData)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Submit a Bid
      </h3>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Your Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quote_amount" className="text-xs text-muted-foreground">
            Quote Amount ($)
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="quote_amount"
              name="quote_amount"
              type="number"
              placeholder="450000"
              required
              min={1}
              className="pl-7"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timeline_weeks" className="text-xs text-muted-foreground">
            Timeline (weeks)
          </Label>
          <Input
            id="timeline_weeks"
            name="timeline_weeks"
            type="number"
            placeholder="24"
            min={1}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            Cover Letter{" "}
            <span className="text-muted-foreground/60">
              ({500 - coverLetter.length} chars remaining)
            </span>
          </Label>
          <Textarea
            name="cover_letter"
            placeholder="Why you're the right fit for this project..."
            value={coverLetter}
            onChange={(e) =>
              setCoverLetter(e.target.value.slice(0, 500))
            }
            maxLength={500}
            rows={4}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Bid"
          )}
        </Button>
      </form>
    </div>
  )
}
