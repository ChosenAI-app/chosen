import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <div className="flex flex-col">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between border-b border-border/50 py-3 last:border-b-0"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {member.invited_email}
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-secondary px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider text-secondary-foreground">
                {ROLE_LABELS[member.role as ProjectRole] ?? member.role}
              </span>
              <StatusBadge status={member.invite_status} />
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
