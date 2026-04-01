"use client"

import { useState, useTransition } from "react"
import { updateProfile } from "@/lib/actions/profiles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export function ProfileEditForm({
  companyName,
  licenseNumber,
  bio: initialBio,
  phone,
  websiteUrl,
}: {
  companyName: string
  licenseNumber: string
  bio: string
  phone: string
  websiteUrl: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [bio, setBio] = useState(initialBio)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Professional Profile
      </h3>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Company Name</Label>
          <Input
            name="company_name"
            defaultValue={companyName}
            placeholder="Smith Construction LLC"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            License Number
          </Label>
          <Input
            name="license_number"
            defaultValue={licenseNumber}
            placeholder="CA-123456"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            Bio{" "}
            <span className="text-muted-foreground/60">
              ({300 - bio.length} chars)
            </span>
          </Label>
          <Textarea
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 300))}
            maxLength={300}
            placeholder="Tell homeowners about your experience..."
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Phone</Label>
          <Input
            name="phone"
            defaultValue={phone}
            placeholder="(650) 555-1234"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Website URL</Label>
          <Input
            name="website_url"
            defaultValue={websiteUrl}
            placeholder="https://smithconstruction.com"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-400">Profile updated.</p>}

        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </form>
    </div>
  )
}
