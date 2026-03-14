"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const partRoles = ["admin", "engineer", "approver"] as const;

type UserProfileRow = {
  organization_id: string | null;
};

async function getActorContext() {
  const access = await getAuthenticatedAppContext();
  if (access.status !== "authorized") {
    throw new Error("Unauthorized");
  }

  if (!hasRoleAccess(access.user.role, partRoles)) {
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

export async function createPart(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const partNumber = String(formData.get("partNumber") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const partType = String(formData.get("partType") ?? "").trim();
  const unitOfMeasure = String(formData.get("unitOfMeasure") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!partNumber || !name) {
    throw new Error("partNumber and name are required");
  }

  const { error } = await supabase.from("parts").insert({
    organization_id: organizationId,
    part_number: partNumber,
    name,
    part_type: partType || null,
    unit_of_measure: unitOfMeasure || null,
    description: description || null,
    lifecycle_status: "draft",
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/parts");
  redirect("/parts");
}

export async function updatePart(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const partId = String(formData.get("partId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const partType = String(formData.get("partType") ?? "").trim();
  const unitOfMeasure = String(formData.get("unitOfMeasure") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const lifecycleStatus = String(formData.get("lifecycleStatus") ?? "draft").trim();

  if (!partId || !name) {
    throw new Error("partId and name are required");
  }

  const { error } = await supabase
    .from("parts")
    .update({
      name,
      part_type: partType || null,
      unit_of_measure: unitOfMeasure || null,
      description: description || null,
      lifecycle_status: lifecycleStatus || "draft",
    })
    .eq("organization_id", organizationId)
    .eq("id", partId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/parts");
  revalidatePath(`/parts/${partId}`);
  redirect(`/parts/${partId}`);
}

export async function deletePart(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const partId = String(formData.get("partId") ?? "").trim();
  if (!partId) {
    throw new Error("partId is required");
  }

  const { error } = await supabase
    .from("parts")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", partId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/parts");
  redirect("/parts");
}

export async function createPartRevision(formData: FormData) {
  const { supabase, organizationId, userId } = await getActorContext();

  const partId = String(formData.get("partId") ?? "").trim();
  const revisionCode = String(formData.get("revisionCode") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const setAsCurrent = String(formData.get("setAsCurrent") ?? "") === "on";

  if (!partId || !revisionCode) {
    throw new Error("partId and revisionCode are required");
  }

  const normalizedStatus = status || "draft";
  const releasedAt =
    normalizedStatus.toLowerCase() === "released" ? new Date().toISOString() : null;

  const { data: createdRevision, error: createError } = await supabase
    .from("part_revisions")
    .insert({
      organization_id: organizationId,
      part_id: partId,
      revision_code: revisionCode,
      status: normalizedStatus,
      summary: summary || null,
      released_at: releasedAt,
      released_by: releasedAt ? userId : null,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (createError || !createdRevision) {
    throw new Error(createError?.message || "Failed to create part revision");
  }

  if (setAsCurrent) {
    const { error: updateError } = await supabase
      .from("parts")
      .update({ current_revision_id: createdRevision.id })
      .eq("organization_id", organizationId)
      .eq("id", partId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  revalidatePath("/parts");
  revalidatePath(`/parts/${partId}`);
  revalidatePath("/boms");
  redirect(`/parts/${partId}`);
}
