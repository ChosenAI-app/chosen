/*
 * STORAGE SETUP — run once in Supabase dashboard before testing:
 *
 * 1. Storage → New bucket → name: "project-documents" → PUBLIC: YES
 *
 * 2. Storage → project-documents → Policies → New policy:
 *    Operation: INSERT
 *    Policy name: "Authenticated users can upload"
 *    USING expression: (bucket_id = 'project-documents' AND auth.role() = 'authenticated')
 *
 * 3. Storage → project-documents → Policies → New policy:
 *    Operation: SELECT
 *    Policy name: "Authenticated users can read"
 *    USING expression: (bucket_id = 'project-documents' AND auth.role() = 'authenticated')
 *
 * 4. Storage → project-documents → Policies → New policy:
 *    Operation: DELETE
 *    Policy name: "Authenticated users can delete own files"
 *    USING expression: (bucket_id = 'project-documents' AND auth.uid() = owner)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .toLowerCase();
}

export async function getUploadUrl(params: {
  projectId: string;
  permitRequirementId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}): Promise<{
  signedUrl: string;
  token: string;
  path: string;
  error: string | null;
}> {
  const { projectId, permitRequirementId, fileName, fileType, fileSize } =
    params;

  // a. Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    return { signedUrl: "", token: "", path: "", error: "File must be under 20MB." };
  }

  // b. Validate file type
  if (!ALLOWED_TYPES.includes(fileType)) {
    return {
      signedUrl: "",
      token: "",
      path: "",
      error: "Only PDF, JPEG, PNG, or WebP files allowed.",
    };
  }

  // c. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { signedUrl: "", token: "", path: "", error: "Not authenticated." };
  }

  // d. Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { signedUrl: "", token: "", path: "", error: "Project not found." };
  }

  // e. Sanitize file name
  const sanitized = sanitizeFileName(fileName);

  // f. Build path
  const path = `${projectId}/${permitRequirementId}/${Date.now()}-${sanitized}`;

  // g. Create signed upload URL
  const { data, error } = await supabase.storage
    .from("project-documents")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return {
      signedUrl: "",
      token: "",
      path: "",
      error: error?.message ?? "Failed to create upload URL.",
    };
  }

  // h. Return
  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    error: null,
  };
}

export async function recordUpload(params: {
  projectId: string;
  permitRequirementId: string;
  storagePath: string;
  fileName: string;
}): Promise<{ error: string | null }> {
  const { projectId, permitRequirementId, storagePath, fileName } = params;

  // a. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // b. Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Project not found." };
  }

  // c. Build public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("project-documents").getPublicUrl(storagePath);

  // d. Insert record
  const { error: insertError } = await supabase
    .from("project_documents")
    .insert({
      project_id: projectId,
      permit_requirement_id: permitRequirementId,
      file_name: fileName,
      file_url: publicUrl,
      uploaded_by: user.id,
      status: "uploaded",
    });

  if (insertError) {
    return { error: insertError.message };
  }

  // e. Revalidate
  revalidatePath("/projects/" + projectId + "/documents");

  // f. Return
  return { error: null };
}

export async function deleteDocument(
  documentId: string,
  projectId: string
): Promise<{ error: string | null }> {
  // a. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // b. Fetch document
  const { data: doc } = await supabase
    .from("project_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (!doc) {
    return { error: "Document not found." };
  }

  // c. Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", doc.project_id)
    .single();

  if (!project || project.user_id !== user.id) {
    return { error: "Project not found." };
  }

  // d. Extract storage path from file_url
  const marker = "/project-documents/";
  const markerIndex = doc.file_url.indexOf(marker);
  if (markerIndex !== -1) {
    const storagePath = doc.file_url.substring(markerIndex + marker.length);

    // e. Remove from storage
    await supabase.storage.from("project-documents").remove([storagePath]);
  }

  // f. Delete record
  const { error: deleteError } = await supabase
    .from("project_documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // g. Revalidate
  revalidatePath("/projects/" + projectId + "/documents");

  // h. Return
  return { error: null };
}
