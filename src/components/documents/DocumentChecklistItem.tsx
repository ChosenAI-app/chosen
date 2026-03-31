"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { deleteDocument } from "@/lib/actions/documents";
import { FileUploadButton } from "@/components/documents/FileUploadButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PermitRequirement, ProjectDocument } from "@/lib/types";

const DOC_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive"
> = {
  uploaded: "default",
  approved: "default",
  rejected: "destructive",
};

interface DocumentChecklistItemProps {
  projectId: string;
  requirement: PermitRequirement;
  uploadedDoc: ProjectDocument | null;
}

export function DocumentChecklistItem({
  projectId,
  requirement,
  uploadedDoc,
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
    <div className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{requirement.document_name}</p>
          <Badge variant={requirement.required ? "default" : "secondary"}>
            {requirement.required ? "Required" : "Optional"}
          </Badge>
        </div>
        {requirement.description && (
          <p className="text-xs text-muted-foreground">
            {requirement.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {uploadedDoc === null ? (
          <FileUploadButton
            projectId={projectId}
            permitRequirementId={requirement.id}
            onSuccess={() => router.refresh()}
          />
        ) : (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <a
                href={uploadedDoc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-foreground underline underline-offset-2"
              >
                {uploadedDoc.file_name}
                <ExternalLink className="size-3" />
              </a>
              <Badge variant={DOC_STATUS_VARIANT[uploadedDoc.status] ?? "secondary"}>
                {uploadedDoc.status}
              </Badge>
            </div>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
            {deleteError && (
              <p className="text-xs text-destructive">{deleteError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
