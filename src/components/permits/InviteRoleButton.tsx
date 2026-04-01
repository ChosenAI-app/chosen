"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, Loader2, X } from "lucide-react"
import { inviteTeamMember } from "@/lib/actions/team"

export function InviteRoleButton({
  projectId,
  role,
  label,
}: {
  projectId: string
  role: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleInvite() {
    if (!email.trim()) return
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("email", email.trim())
      formData.set("role", role)
      formData.set("projectId", projectId)
      const result = await inviteTeamMember(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          setEmail("")
          setSuccess(false)
          router.refresh()
        }, 1500)
      }
    })
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="mr-1 size-3" />
        Invite
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {success ? (
        <span className="text-xs text-green-400">Invited ✓</span>
      ) : (
        <>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="h-7 w-44 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            autoFocus
          />
          <Button
            size="sm"
            className="h-7 text-xs bg-primary text-primary-foreground"
            onClick={handleInvite}
            disabled={pending || !email.trim()}
          >
            {pending ? <Loader2 className="size-3 animate-spin" /> : "Send"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              setOpen(false)
              setEmail("")
            }}
          >
            <X className="size-3" />
          </Button>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
