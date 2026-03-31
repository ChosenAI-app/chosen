import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { RemoveTeamMemberButton } from "@/components/team/RemoveTeamMemberButton";
import { ROLE_LABELS, type ProjectRole } from "@/lib/utils/permissions";
import type { TeamMember } from "@/lib/types";

interface TeamMemberListProps {
  projectId: string;
  currentUserId: string;
  canManage: boolean;
}

export async function TeamMemberList({
  projectId,
  currentUserId,
  canManage,
}: TeamMemberListProps) {
  const supabase = await createClient();

  const { data: membersData } = await supabase
    .from("team_members")
    .select("*")
    .eq("project_id", projectId)
    .order("invited_at", { ascending: true });

  const members = (membersData ?? []) as TeamMember[];

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No team members yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border px-4 py-3"
        >
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium">{member.invited_email}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {ROLE_LABELS[member.role as ProjectRole] ?? member.role}
              </Badge>
              <span
                className={`inline-flex h-5 items-center rounded-4xl px-2 text-xs font-medium ${
                  member.invite_status === "accepted"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {member.invite_status === "accepted" ? "Accepted" : "Pending"}
              </span>
            </div>
          </div>
          {canManage && member.user_id !== currentUserId && (
            <RemoveTeamMemberButton
              memberId={member.id}
              projectId={projectId}
            />
          )}
        </div>
      ))}
    </div>
  );
}
