"use client";

import { useOptimistic, useTransition } from "react";
import { updatePermitStatus } from "@/lib/actions/permits";
import { getStatusLabel } from "@/lib/utils/status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  "not_started",
  "submitted",
  "in_review",
  "corrections",
  "approved",
  "issued",
] as const;

interface PermitStatusSelectProps {
  projectPermitId: string;
  projectId: string;
  currentStatus: string;
}

export function PermitStatusSelect({
  projectPermitId,
  projectId,
  currentStatus,
}: PermitStatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] =
    useOptimistic(currentStatus);

  const handleChange = (newValue: string) => {
    startTransition(async () => {
      setOptimisticStatus(newValue);
      const { error } = await updatePermitStatus(
        projectPermitId,
        newValue,
        projectId
      );
      if (error) console.error(error);
    });
  };

  return (
    <Select
      value={optimisticStatus}
      onValueChange={handleChange}
      disabled={isPending}
    >
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {getStatusLabel(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
