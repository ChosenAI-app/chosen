"use client"

import { useState, useTransition, useEffect } from "react"
import { updateProfile } from "@/lib/actions/profiles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function EditProfilePage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [profile, setProfile] = useState<Record<string, string | null>>({})
  const [bio, setBio] = useState("")

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("profiles")
        .select("company_name, license_number, bio, phone, website_url")
        .eq("id", user.id)
        .maybeSingle()
      if (data) {
        setProfile(data)
        setBio(data.bio ?? "")
      }
    }
    load()
  }, [])

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

  const needsCompletion = !profile.company_name || !profile.license_number

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your profile is visible to homeowners on the marketplace.
      </p>

      {needsCompletion && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-yellow-900/50 bg-yellow-950/20 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
          <p className="text-sm text-yellow-200/80">
            Complete your company name and license number to start bidding on
            projects.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Company Name</Label>
          <Input
            name="company_name"
            defaultValue={profile.company_name ?? ""}
            placeholder="Smith Construction LLC"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            License Number
          </Label>
          <Input
            name="license_number"
            defaultValue={profile.license_number ?? ""}
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
            defaultValue={profile.phone ?? ""}
            placeholder="(650) 555-1234"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Website URL</Label>
          <Input
            name="website_url"
            defaultValue={profile.website_url ?? ""}
            placeholder="https://smithconstruction.com"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="text-sm text-green-400">Profile updated.</p>
        )}

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
