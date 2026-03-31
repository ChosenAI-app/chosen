"use client";

import { useTransition } from "react";
import { removeTeamMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";

export function RemoveTeamMemberButton({
  memberId,
  projectId,
}: {
  memberId: string;
  projectId: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await removeTeamMember(memberId, projectId);
        })
      }
    >
      {isPending ? "Removing..." : "Remove"}
    </Button>
  );
}
