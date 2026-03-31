"use client";

import { useState, useTransition } from "react";
import { inviteTeamMember } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteTeamMemberFormProps {
  projectId: string;
}

export function InviteTeamMemberForm({ projectId }: InviteTeamMemberFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"architect" | "client">("architect");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("email", email);
    formData.set("role", role);

    startTransition(async () => {
      const result = await inviteTeamMember(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEmail("");
        setRole("architect");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="architect@firm.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "architect" | "client")}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="architect">Architect</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Inviting..." : "Invite"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
