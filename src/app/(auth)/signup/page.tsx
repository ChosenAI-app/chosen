"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { signUp } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Home, HardHat, ArrowLeft } from "lucide-react"

const PROFESSIONS = [
  { value: "contractor", label: "General Contractor" },
  { value: "architect", label: "Architect" },
  { value: "engineer_structural", label: "Structural Engineer", userType: "engineer" },
  { value: "engineer_mechanical", label: "Mechanical Engineer", userType: "engineer" },
  { value: "engineer_electrical", label: "Electrical Engineer", userType: "engineer" },
  { value: "inspector", label: "Inspector" },
] as const

export default function SignupPage() {
  const [role, setRole] = useState<"homeowner" | "contractor" | null>(null)
  const [profession, setProfession] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const firstName = (formData.get("firstName") as string).trim()
    const lastName = (formData.get("lastName") as string).trim()
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (role === "contractor" && !profession) {
      setError("Please select your profession.")
      return
    }

    let userType = "homeowner"
    if (role === "contractor") {
      const entry = PROFESSIONS.find((p) => p.value === profession)
      userType =
        entry && "userType" in entry
          ? (entry as { userType: string }).userType
          : profession || "contractor"
    }

    console.log("[signup] submitting with user_type:", userType, "role:", role)

    startTransition(async () => {
      const result = await signUp(
        email,
        password,
        `${firstName} ${lastName}`,
        userType
      )
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  if (!role) {
    return (
      <div className="w-full max-w-md">
        <p className="mb-8 text-xs font-bold tracking-[0.25em] text-foreground lg:hidden">
          CHOSEN
        </p>

        <h1 className="text-xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How will you use Chosen?
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={() => setRole("homeowner")}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-all duration-150 hover:border-primary/50 hover:bg-primary/5"
          >
            <Home className="size-8 text-primary" />
            <span className="text-sm font-semibold">I&apos;m a Homeowner</span>
            <span className="text-xs text-muted-foreground text-center">
              I want to plan and permit my home project
            </span>
          </button>

          <button
            onClick={() => setRole("contractor")}
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 transition-all duration-150 hover:border-primary/50 hover:bg-primary/5"
          >
            <HardHat className="size-8 text-primary" />
            <span className="text-sm font-semibold">
              I&apos;m a Professional
            </span>
            <span className="text-xs text-muted-foreground text-center">
              I&apos;m a contractor, architect, or engineer
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Log in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <p className="mb-8 text-xs font-bold tracking-[0.25em] text-foreground lg:hidden">
        CHOSEN
      </p>

      <button
        onClick={() => {
          setRole(null)
          setError(null)
        }}
        className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Back
      </button>

      <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {role === "homeowner"
          ? "Start planning your home project"
          : "Join the Palo Alto contractor marketplace"}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="firstName"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              First name
            </Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Jane"
              required
              autoComplete="given-name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="lastName"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Last name
            </Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Smith"
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        {role === "contractor" && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Profession
            </Label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger>
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent>
                {PROFESSIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="email"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending ? "Creating account..." : "Sign up"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
