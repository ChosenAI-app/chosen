export function getStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  const map: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    not_started: "secondary",
    submitted: "outline",
    in_review: "outline",
    corrections: "destructive",
    approved: "default",
    issued: "default",
  };
  return map[status] ?? "secondary";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    not_started: "Not Started",
    submitted: "Submitted",
    in_review: "In Review",
    corrections: "Corrections Needed",
    approved: "Approved",
    issued: "Permit Issued",
  };
  return map[status] ?? status;
}
