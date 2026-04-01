const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-zinc-700 text-zinc-300",
  submitted: "bg-blue-950 text-blue-300",
  in_review: "bg-yellow-950 text-yellow-300",
  corrections: "bg-red-950 text-red-300",
  approved: "bg-green-950 text-green-300",
  issued: "bg-emerald-900 text-emerald-200",
  pending: "bg-orange-950 text-orange-300",
  accepted: "bg-green-950 text-green-300",
  uploaded: "bg-blue-950 text-blue-300",
  rejected: "bg-red-950 text-red-300",
  draft: "bg-zinc-700 text-zinc-300",
  ai_processing: "bg-yellow-950 text-yellow-300",
  scope_ready: "bg-blue-950 text-blue-300",
  posted_to_marketplace: "bg-violet-950 text-violet-300",
  contractor_selected: "bg-green-950 text-green-300",
  permit_in_progress: "bg-yellow-950 text-yellow-300",
  permitted: "bg-emerald-900 text-emerald-200",
  construction: "bg-orange-950 text-orange-300",
  complete: "bg-green-950 text-green-200",
  cancelled: "bg-red-950 text-red-300",
  declined: "bg-red-950 text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  submitted: "Submitted",
  in_review: "In Review",
  corrections: "Corrections",
  approved: "Approved",
  issued: "Issued",
  pending: "Pending",
  accepted: "Accepted",
  uploaded: "Uploaded",
  rejected: "Rejected",
  draft: "Draft",
  ai_processing: "AI Processing",
  scope_ready: "Scope Ready",
  posted_to_marketplace: "On Marketplace",
  contractor_selected: "Contractor Selected",
  permit_in_progress: "Permitting",
  permitted: "Permitted",
  construction: "Construction",
  complete: "Complete",
  cancelled: "Cancelled",
  declined: "Declined",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-zinc-700 text-zinc-300";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={`status-stamp ${style} ${className}`}>
      {label}
    </span>
  );
}
