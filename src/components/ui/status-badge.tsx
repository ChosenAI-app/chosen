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
