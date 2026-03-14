"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type UserProfileRow = {
  organization_id: string | null;
};

const changeRoles = ["admin", "engineer", "approver"] as const;

function formatDateToken(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function generateChangeNumber() {
  const dateToken = formatDateToken(new Date());
  const randomToken = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CR-${dateToken}-${randomToken}`;
}

export async function createChangeRequest(
  _previousState: unknown,
  formData: FormData,
): Promise<{
  status: "idle" | "success" | "error";
  message: string | null;
  changeRequestId?: string;
  changeNumber?: string;
}> {
  const access = await getAuthenticatedAppContext();

  if (access.status !== "authorized") {
    return {
      status: "error",
      message: "You need an active session to create a change request.",
    };
  }

  if (!hasRoleAccess(access.user.role, changeRoles)) {
    return {
      status: "error",
      message: "Your role does not have access to create change requests.",
    };
  }

  const entityType = formData.get("entityType");
  const entityId = formData.get("entityId");
  const titleInput = formData.get("title");
  const descriptionInput = formData.get("description");
  const reasonInput = formData.get("reason");
  const impactSummaryInput = formData.get("impactSummary");
  const beforeRevisionInput = formData.get("beforeRevision");

  if (entityType !== "product" && entityType !== "part") {
    return {
      status: "error",
      message: "Change request context is invalid. Start from product or part detail.",
    };
  }

  if (typeof entityId !== "string" || !entityId.trim()) {
    return {
      status: "error",
      message: "Entity identifier is missing from the request context.",
    };
  }

  if (typeof titleInput !== "string" || !titleInput.trim()) {
    return {
      status: "error",
      message: "Title is required.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Unable to resolve signed-in user.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle<UserProfileRow>();

  if (profileError || !profile?.organization_id) {
    return {
      status: "error",
      message: "User organization profile is not available.",
    };
  }

  const title = titleInput.trim();
  const description = typeof descriptionInput === "string" ? descriptionInput.trim() : "";
  const reason = typeof reasonInput === "string" ? reasonInput.trim() : "";
  const impactSummary =
    typeof impactSummaryInput === "string" ? impactSummaryInput.trim() : "";
  const beforeRevision =
    typeof beforeRevisionInput === "string" && beforeRevisionInput.trim().length > 0
      ? beforeRevisionInput.trim()
      : null;

  let createdRequest:
    | {
        id: string;
        change_number: string;
      }
    | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const changeNumber = generateChangeNumber();

    const { data, error } = await supabase
      .from("change_requests")
      .insert({
        organization_id: profile.organization_id,
        change_number: changeNumber,
        title,
        description: description || null,
        reason: reason || null,
        impact_summary: impactSummary || null,
        status: "draft",
        requested_by: user.id,
      })
      .select("id,change_number")
      .maybeSingle<{ id: string; change_number: string }>();

    if (error) {
      if (error.code === "23505") {
        continue;
      }

      return {
        status: "error",
        message: `Change request could not be created: ${error.message}`,
      };
    }

    if (data) {
      createdRequest = data;
      break;
    }
  }

  if (!createdRequest) {
    return {
      status: "error",
      message: "Could not generate a unique change number. Please retry.",
    };
  }

  const { error: itemError } = await supabase.from("change_items").insert({
    organization_id: profile.organization_id,
    change_request_id: createdRequest.id,
    entity_type: entityType,
    entity_id: entityId.trim(),
    change_action: "update",
    before_revision: beforeRevision,
    after_revision: null,
    notes: null,
  });

  if (itemError) {
    return {
      status: "error",
      message: `Change request was created but initial change item failed: ${itemError.message}`,
      changeRequestId: createdRequest.id,
      changeNumber: createdRequest.change_number,
    };
  }

  if (entityType === "product") {
    revalidatePath(`/products/${entityId}`);
  }

  if (entityType === "part") {
    revalidatePath(`/parts/${entityId}`);
  }

  revalidatePath("/changes/new");

  return {
    status: "success",
    message: `Change request ${createdRequest.change_number} created successfully.`,
    changeRequestId: createdRequest.id,
    changeNumber: createdRequest.change_number,
  };
}
