"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type CadFileRecord = {
  id: string;
  organization_id: string;
};
type UserProfileRow = {
  organization_id: string | null;
};

const cadPageRoles = ["admin", "engineer", "supplier"] as const;

function sanitizeFileName(name: string) {
  return name.replaceAll(/[^\w.-]/g, "_");
}

function getNextRevisionCode(currentCode: string | null) {
  if (!currentCode) {
    return "A";
  }

  const normalized = currentCode.trim().toUpperCase();
  const singleLetterPattern = /^[A-Z]$/;
  if (singleLetterPattern.test(normalized)) {
    if (normalized === "Z") {
      return "R1";
    }

    const code = normalized.charCodeAt(0) + 1;
    return String.fromCharCode(code);
  }

  const releasePattern = /^R(\d+)$/;
  const match = releasePattern.exec(normalized);
  if (match) {
    const next = Number(match[1]) + 1;
    return `R${next}`;
  }

  return "R1";
}

export async function uploadCadRevision(
  _previousState: unknown,
  formData: FormData,
): Promise<{
  status: "idle" | "success" | "error";
  message: string | null;
}> {
  const access = await getAuthenticatedAppContext();

  if (access.status !== "authorized") {
    return {
      status: "error",
      message: "You need an active session to upload a CAD revision.",
    };
  }

  if (!hasRoleAccess(access.user.role, cadPageRoles)) {
    return {
      status: "error",
      message: "Your role does not have access to upload CAD revisions.",
    };
  }

  const cadFileId = formData.get("cadFileId");
  const viewerUrlEntry = formData.get("viewerUrl");
  const fileEntry = formData.get("file");

  if (typeof cadFileId !== "string" || !cadFileId) {
    return { status: "error", message: "Missing CAD file context for upload." };
  }

  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { status: "error", message: "Choose a CAD file before uploading." };
  }

  const viewerUrl =
    typeof viewerUrlEntry === "string" && viewerUrlEntry.trim().length > 0
      ? viewerUrlEntry.trim()
      : null;

  if (viewerUrl) {
    try {
      new URL(viewerUrl);
    } catch {
      return {
        status: "error",
        message: "Viewer URL must be a valid absolute URL.",
      };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "error", message: "Unable to resolve the signed-in user session." };
  }

  const { data: cadFile, error: cadFileError } = await supabase
    .from("cad_files")
    .select("id,organization_id")
    .eq("id", cadFileId)
    .maybeSingle<CadFileRecord>();

  if (cadFileError || !cadFile) {
    return { status: "error", message: "CAD record could not be loaded for this upload." };
  }

  const { data: latestRevision, error: latestRevisionError } = await supabase
    .from("cad_file_revisions")
    .select("revision_code")
    .eq("cad_file_id", cadFileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ revision_code: string }>();

  if (latestRevisionError) {
    return {
      status: "error",
      message: "Could not evaluate current CAD revision before upload.",
    };
  }

  const nextRevisionCode = getNextRevisionCode(latestRevision?.revision_code ?? null);
  const sanitizedFileName = sanitizeFileName(fileEntry.name || "cad-file");
  const storagePath = `${cadFile.organization_id}/${cadFileId}/${Date.now()}-${sanitizedFileName}`;
  const storageBucket = "cad-files";

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(storagePath, fileEntry, {
      upsert: false,
      contentType: fileEntry.type || undefined,
    });

  if (uploadError) {
    return {
      status: "error",
      message: `File upload failed: ${uploadError.message}`,
    };
  }

  const { data: insertedRevision, error: insertError } = await supabase
    .from("cad_file_revisions")
    .insert({
      organization_id: cadFile.organization_id,
      cad_file_id: cadFileId,
      revision_code: nextRevisionCode,
      file_name: fileEntry.name,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      viewer_url: viewerUrl,
      mime_type: fileEntry.type || null,
      file_size_bytes: fileEntry.size,
      status: "draft",
      uploaded_by: user.id,
    })
    .select("id,revision_code")
    .maybeSingle<{ id: string; revision_code: string }>();

  if (insertError || !insertedRevision) {
    return {
      status: "error",
      message: "CAD revision metadata could not be saved after file upload.",
    };
  }

  const { error: updateCadFileError } = await supabase
    .from("cad_files")
    .update({ current_revision_id: insertedRevision.id })
    .eq("id", cadFileId);

  if (updateCadFileError) {
    return {
      status: "error",
      message: "CAD revision uploaded but current revision pointer could not be updated.",
    };
  }

  revalidatePath("/cad");
  revalidatePath(`/cad/${cadFileId}`);

  return {
    status: "success",
    message: `CAD revision ${insertedRevision.revision_code} uploaded successfully.`,
  };
}

async function getActorContext() {
  const access = await getAuthenticatedAppContext();

  if (access.status !== "authorized") {
    throw new Error("Unauthorized");
  }

  if (!hasRoleAccess(access.user.role, cadPageRoles)) {
    throw new Error("Forbidden");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle<UserProfileRow>();

  if (!profile?.organization_id) {
    throw new Error("Missing organization");
  }

  return {
    supabase,
    userId: user.id,
    organizationId: profile.organization_id,
  };
}

export async function createCadFile(formData: FormData) {
  const { supabase, userId, organizationId } = await getActorContext();

  const cadNumber = String(formData.get("cadNumber") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const cadType = String(formData.get("cadType") ?? "").trim();
  const ownerEntityType = String(formData.get("ownerEntityType") ?? "").trim();
  const ownerEntityId = String(formData.get("ownerEntityId") ?? "").trim();

  if (!cadNumber || !title || !ownerEntityType || !ownerEntityId) {
    throw new Error("cad metadata is incomplete");
  }

  if (ownerEntityType !== "product" && ownerEntityType !== "part") {
    throw new Error("ownerEntityType must be product or part");
  }

  if (ownerEntityType === "product") {
    const { data: ownerProduct, error: ownerError } = await supabase
      .from("products")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", ownerEntityId)
      .maybeSingle<{ id: string }>();
    if (ownerError || !ownerProduct) {
      throw new Error("Selected owner entity does not match owner type product");
    }
  }

  if (ownerEntityType === "part") {
    const { data: ownerPart, error: ownerError } = await supabase
      .from("parts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", ownerEntityId)
      .maybeSingle<{ id: string }>();
    if (ownerError || !ownerPart) {
      throw new Error("Selected owner entity does not match owner type part");
    }
  }

  const { error } = await supabase.from("cad_files").insert({
    organization_id: organizationId,
    cad_number: cadNumber,
    title,
    cad_type: cadType || null,
    owner_entity_type: ownerEntityType,
    owner_entity_id: ownerEntityId,
    status: "draft",
    created_by: userId,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/cad");
  redirect("/cad");
}

export async function updateCadFile(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const cadFileId = String(formData.get("cadFileId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const cadType = String(formData.get("cadType") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!cadFileId || !title) {
    throw new Error("cadFileId and title are required");
  }

  const { error } = await supabase
    .from("cad_files")
    .update({
      title,
      cad_type: cadType || null,
      status: status || "draft",
    })
    .eq("organization_id", organizationId)
    .eq("id", cadFileId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/cad");
  revalidatePath(`/cad/${cadFileId}`);
  redirect(`/cad/${cadFileId}`);
}

export async function deleteCadFile(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const cadFileId = String(formData.get("cadFileId") ?? "").trim();
  if (!cadFileId) {
    throw new Error("cadFileId is required");
  }

  const { error } = await supabase
    .from("cad_files")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", cadFileId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/cad");
  redirect("/cad");
}
