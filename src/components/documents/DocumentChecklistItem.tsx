"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Paperclip } from "lucide-react";
import { deleteDocument } from "@/lib/actions/documents";
import { FileUploadButton } from "@/components/documents/FileUploadButton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  canUploadDocuments,
  canDeleteDocuments,
  type ProjectRole,
} from "@/lib/utils/permissions";
import type { PermitRequirement, ProjectDocument } from "@/lib/types";

interface DocumentChecklistItemProps {
  projectId: string;
  requirement: PermitRequirement;
  uploadedDoc: ProjectDocument | null;
  userRole: ProjectRole;
}

export function DocumentChecklistItem({
  projectId,
  requirement,
  uploadedDoc,
  userRole,
}: DocumentChecklistItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!uploadedDoc) return;
    setIsDeleting(true);
    setDeleteError(null);
    const { error } = await deleteDocument(uploadedDoc.id, projectId);
    if (error) {
      setDeleteError(error);
      setIsDeleting(false);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {/* Required/optional dot */}
        <span
          className={`size-2 shrink-0 rounded-full ${
            requirement.required ? "bg-primary" : "bg-zinc-600"
          }`}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {requirement.document_name}
          </p>
          {requirement.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {requirement.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {uploadedDoc === null ? (
          canUploadDocuments(userRole) ? (
            <FileUploadButton
              projectId={projectId}
              permitRequirementId={requirement.id}
              onSuccess={() => router.refresh()}
            />
          ) : (
            <span className="text-xs text-muted-foreground">No file</span>
          )
        ) : (
          <div className="flex items-center gap-2">
            <a
              href={uploadedDoc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-foreground underline underline-offset-2 transition-all duration-150 hover:text-primary"
            >
              <Paperclip className="size-3" />
              {uploadedDoc.file_name}
              <ExternalLink className="size-3" />
            </a>
            <StatusBadge status={uploadedDoc.status} />
            {canDeleteDocuments(userRole) && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
                onClick={handleDelete}
                className="h-6 px-2 text-xs text-destructive hover:text-destructive transition-all duration-150"
              >
                {isDeleting ? "..." : "Remove"}
              </Button>
            )}
            {deleteError && (
              <p className="text-xs text-destructive">{deleteError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
