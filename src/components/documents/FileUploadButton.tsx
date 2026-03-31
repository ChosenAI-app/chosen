"use client";

import { useRef, useState } from "react";
import { getUploadUrl, recordUpload } from "@/lib/actions/documents";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";

interface FileUploadButtonProps {
  projectId: string;
  permitRequirementId: string;
  onSuccess: () => void;
}

export function FileUploadButton({
  projectId,
  permitRequirementId,
  onSuccess,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB");
      return;
    }
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowed.includes(file.type)) {
      setError("Only PDF, JPEG, PNG, or WebP files allowed");
      return;
    }

    setIsUploading(true);
    setError(null);

    setStatus("Preparing...");
    const {
      token,
      path,
      error: urlError,
    } = await getUploadUrl({
      projectId,
      permitRequirementId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
    if (urlError) {
      setError(urlError);
      setIsUploading(false);
      return;
    }

    setStatus("Uploading...");
    const browserClient = createClient();
    const { error: uploadError } = await browserClient.storage
      .from("project-documents")
      .uploadToSignedUrl(path, token, file, { contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setIsUploading(false);
      return;
    }

    setStatus("Saving...");
    const { error: recordError } = await recordUpload({
      projectId,
      permitRequirementId,
      storagePath: path,
      fileName: file.name,
    });
    if (recordError) {
      setError(recordError);
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
    setStatus("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onSuccess();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="h-7 gap-1.5 text-xs transition-all duration-150"
      >
        <Paperclip className="size-3" />
        {isUploading ? status || "Uploading..." : "Upload"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
