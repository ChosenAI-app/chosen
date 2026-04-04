"use client"

import Link from "next/link"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Building2,
} from "lucide-react"

const STATUS_CONFIG: Record<
  string,
  {
    icon: typeof Clock
    color: string
    bg: string
    label: string
    description: string
  }
> = {
  pending: {
    icon: Clock,
    color: "text-muted-foreground",
    bg: "border-border bg-card/50",
    label: "Submission Pending",
    description: "Your application is queued for submission.",
  },
  draft_created: {
    icon: Clock,
    color: "text-primary",
    bg: "border-primary/20 bg-primary/5",
    label: "Submitting...",
    description: "Creating permit application record...",
  },
  forms_filled: {
    icon: Clock,
    color: "text-primary",
    bg: "border-primary/20 bg-primary/5",
    label: "Submitting...",
    description: "Uploading project details...",
  },
  documents_uploaded: {
    icon: Clock,
    color: "text-primary",
    bg: "border-primary/20 bg-primary/5",
    label: "Submitting...",
    description: "Finalizing submission...",
  },
  submitted: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "border-green-900/50 bg-green-950/20",
    label: "Submitted to City ✓",
    description:
      "Your application has been received by the City of Palo Alto Building Division.",
  },
  in_review: {
    icon: Building2,
    color: "text-blue-400",
    bg: "border-blue-900/50 bg-blue-950/20",
    label: "Under City Review",
    description:
      "The city is reviewing your permit application. Plan check takes 6–10 weeks.",
  },
  corrections_required: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "border-amber-900/50 bg-amber-950/20",
    label: "Corrections Required",
    description:
      "The city has requested corrections to your application.",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-green-400",
    bg: "border-green-900/50 bg-green-950/20",
    label: "Permit Approved ✓",
    description:
      "Your building permit has been issued by the City of Palo Alto.",
  },
  rejected: {
    icon: XCircle,
    color: "text-destructive",
    bg: "border-destructive/30 bg-destructive/5",
    label: "Permit Denied",
    description:
      "Your permit application was denied. Contact the city for details.",
  },
  error: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "border-destructive/30 bg-destructive/5",
    label: "Submission Error",
    description: "There was an error submitting your application.",
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AccelaSubmissionStatus({ submission }: { submission: any }) {
  const config = STATUS_CONFIG[submission.status] ?? STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <div className={`rounded-lg border ${config.bg} p-5`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 ${config.color}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${config.color}`}>{config.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.description}
          </p>

          {submission.accela_custom_id && (
            <div className="mt-3 inline-flex flex-col">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Permit Record Number
              </span>
              <span className="mt-0.5 font-mono text-lg font-bold">
                {submission.accela_custom_id}
              </span>
            </div>
          )}

          {submission.submitted_at && (
            <p className="mt-2 text-xs text-muted-foreground">
              Submitted{" "}
              {new Date(submission.submitted_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          {submission.last_error && (
            <p className="mt-2 font-mono text-xs text-destructive">
              Error: {submission.last_error}
            </p>
          )}

          {submission.status === "corrections_required" && (
            <div className="mt-3">
              <Link
                href={`/homeowner/projects/${submission.homeowner_project_id}/corrections`}
                className="text-sm font-medium text-primary hover:underline"
              >
                View correction requirements →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
