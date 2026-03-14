"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const bomRoles = ["admin", "engineer", "approver"] as const;

type UserProfileRow = {
  organization_id: string | null;
};

async function getActorContext() {
  const access = await getAuthenticatedAppContext();
  if (access.status !== "authorized") {
    throw new Error("Unauthorized");
  }

  if (!hasRoleAccess(access.user.role, bomRoles)) {
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
    organizationId: profile.organization_id,
    userId: user.id,
  };
}

export async function createBom(formData: FormData) {
  const { supabase, organizationId, userId } = await getActorContext();

  const productRevisionId = String(formData.get("productRevisionId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!productRevisionId || !name) {
    throw new Error("productRevisionId and name are required");
  }

  const { error } = await supabase.from("boms").insert({
    organization_id: organizationId,
    product_revision_id: productRevisionId,
    name,
    status: "draft",
    created_by: userId,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/boms");
  redirect("/boms");
}

export async function updateBom(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const bomId = String(formData.get("bomId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();

  if (!bomId || !name) {
    throw new Error("bomId and name are required");
  }

  const { error } = await supabase
    .from("boms")
    .update({ name, status: status || "draft" })
    .eq("organization_id", organizationId)
    .eq("id", bomId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/boms");
  redirect("/boms");
}

export async function deleteBom(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const bomId = String(formData.get("bomId") ?? "").trim();
  if (!bomId) {
    throw new Error("bomId is required");
  }

  const { error } = await supabase
    .from("boms")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", bomId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/boms");
  redirect("/boms");
}
