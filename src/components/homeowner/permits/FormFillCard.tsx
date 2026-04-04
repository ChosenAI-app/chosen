"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  updateFlaggedField,
  approveFormFill,
} from "@/lib/actions/permit-forms"
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"

interface FlaggedField {
  field_name: string
  label: string
  reason: string
  input_type: "text" | "number" | "boolean" | "select"
  options?: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormFillCard({ fill }: { fill: any }) {
  const [expanded, setExpanded] = useState(fill.status === "needs_review")
  const [showAllFilled, setShowAllFilled] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [approvePending, startApprove] = useTransition()
  const router = useRouter()

  const flagged = (fill.flagged_fields as FlaggedField[]) ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filled = (fill.filled_fields as Record<string, any>) ?? {}
  const filledEntries = Object.entries(filled).filter(
    ([, v]) => v !== null && v !== "" && v !== undefined
  )

  async function handleSave(fieldName: string, value?: string | boolean) {
    const val = typeof value !== "undefined" ? value : values[fieldName]
    if (val === "" || val === undefined) return
    setSaving(fieldName)
    const result = await updateFlaggedField(
      fill.id,
      fieldName,
      val as string | boolean
    )
    setSaving(null)
    if (!result.error) router.refresh()
  }

  function handleApprove() {
    startApprove(async () => {
      await approveFormFill(fill.id)
      router.refresh()
    })
  }

  const isApproved = fill.status === "approved"

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-all ${
        isApproved
          ? "border-green-900/50 bg-green-950/10"
          : "border-amber-900/40 bg-card"
      }`}
    >
      <button
        className="flex w-full items-center justify-between p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {isApproved ? (
            <CheckCircle2 className="size-5 shrink-0 text-green-400" />
          ) : (
            <AlertTriangle className="size-5 shrink-0 text-amber-400" />
          )}
          <div>
            <p className="text-sm font-semibold">{fill.form_name}</p>
            <p
              className={`mt-0.5 text-xs ${isApproved ? "text-green-400" : "text-amber-400"}`}
            >
              {isApproved
                ? `Approved — ${filledEntries.length} fields pre-filled`
                : `${flagged.length} field${flagged.length !== 1 ? "s" : ""} need your input · ${filledEntries.length} pre-filled`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isApproved && (
            <span className="rounded-sm border border-green-900 bg-green-950 px-2 py-0.5 text-xs font-medium text-green-400">
              Approved
            </span>
          )}
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-5 border-t border-border/50 p-4">
          {flagged.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-400" />
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Your Input Needed
                </p>
              </div>

              {flagged.map((field: FlaggedField) => (
                <div
                  key={field.field_name}
                  className="flex flex-col gap-1.5 rounded-md border border-amber-900/30 bg-amber-950/10 p-3"
                >
                  <label className="text-sm font-semibold">
                    {field.label}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {field.reason}
                  </p>

                  {field.input_type === "select" && field.options && (
                    <div className="mt-1 flex flex-col gap-1.5">
                      {field.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() =>
                            handleSave(field.field_name, opt)
                          }
                          disabled={saving === field.field_name}
                          className="rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {(field.input_type === "text" ||
                    field.input_type === "number") && (
                    <div className="mt-1 flex gap-2">
                      <Input
                        type={field.input_type}
                        value={values[field.field_name] ?? ""}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.field_name]: e.target.value,
                          }))
                        }
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="h-8 flex-1 text-sm"
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleSave(field.field_name)
                        }
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-primary text-xs text-primary-foreground"
                        onClick={() => handleSave(field.field_name)}
                        disabled={
                          saving === field.field_name ||
                          !values[field.field_name]?.trim()
                        }
                      >
                        {saving === field.field_name ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {filledEntries.length > 0 && (
            <div className="flex flex-col gap-2">
              <button
                className="flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllFilled(!showAllFilled)}
              >
                {showAllFilled ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
                <CheckCircle2 className="size-3.5 text-green-400" />
                {filledEntries.length} fields pre-filled by AI
                {showAllFilled ? " (hide)" : " (review)"}
              </button>

              {showAllFilled && (
                <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {filledEntries.map(([key, val]) => {
                    const displayVal =
                      val === true
                        ? "✓ Yes"
                        : val === false
                          ? "✗ No"
                          : String(val)
                    const label = key
                      .split("_")
                      .map(
                        (w) => w.charAt(0).toUpperCase() + w.slice(1)
                      )
                      .join(" ")
                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-0.5 rounded bg-muted/20 px-3 py-2"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {label}
                        </p>
                        <p className="truncate text-sm font-medium">
                          {displayVal}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {flagged.length === 0 && !isApproved && (
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleApprove}
              disabled={approvePending}
            >
              {approvePending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 size-4" />
              )}
              Approve This Form
            </Button>
          )}

          {isApproved && (
            <p className="flex items-center justify-center gap-1.5 text-center text-sm text-green-400">
              <CheckCircle2 className="size-4" />
              Approved — ready for submission
            </p>
          )}
        </div>
      )}
    </div>
  )
}
