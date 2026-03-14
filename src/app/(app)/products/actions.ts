"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const productRoles = ["admin", "engineer", "approver"] as const;

type UserProfileRow = {
  organization_id: string | null;
};

async function getActorContext() {
  const access = await getAuthenticatedAppContext();
  if (access.status !== "authorized") {
    throw new Error("Unauthorized");
  }

  if (!hasRoleAccess(access.user.role, productRoles)) {
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

export async function createProduct(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const productCode = String(formData.get("productCode") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!productCode || !name) {
    throw new Error("productCode and name are required");
  }

  const { error } = await supabase.from("products").insert({
    organization_id: organizationId,
    product_code: productCode,
    name,
    category: category || null,
    description: description || null,
    lifecycle_status: "draft",
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const productId = String(formData.get("productId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const lifecycleStatus = String(formData.get("lifecycleStatus") ?? "draft").trim();

  if (!productId || !name) {
    throw new Error("productId and name are required");
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      category: category || null,
      description: description || null,
      lifecycle_status: lifecycleStatus || "draft",
    })
    .eq("organization_id", organizationId)
    .eq("id", productId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}`);
}

export async function deleteProduct(formData: FormData) {
  const { supabase, organizationId } = await getActorContext();

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    throw new Error("productId is required");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", productId);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/products");
  redirect("/products");
}

export async function createProductRevision(formData: FormData) {
  const { supabase, organizationId, userId } = await getActorContext();

  const productId = String(formData.get("productId") ?? "").trim();
  const revisionCode = String(formData.get("revisionCode") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const setAsCurrent = String(formData.get("setAsCurrent") ?? "") === "on";

  if (!productId || !revisionCode) {
    throw new Error("productId and revisionCode are required");
  }

  const normalizedStatus = status || "draft";
  const releasedAt = normalizedStatus.toLowerCase() === "released" ? new Date().toISOString() : null;

  const { data: createdRevision, error: createError } = await supabase
    .from("product_revisions")
    .insert({
      organization_id: organizationId,
      product_id: productId,
      revision_code: revisionCode,
      status: normalizedStatus,
      summary: summary || null,
      released_at: releasedAt,
      released_by: releasedAt ? userId : null,
    })
    .select("id")
    .maybeSingle<{ id: string }>();

  if (createError || !createdRevision) {
    throw new Error(createError?.message || "Failed to create product revision");
  }

  if (setAsCurrent) {
    const { error: updateError } = await supabase
      .from("products")
      .update({ current_revision_id: createdRevision.id })
      .eq("organization_id", organizationId)
      .eq("id", productId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/boms");
  redirect(`/products/${productId}`);
}

export async function updateProductRevision(formData: FormData) {
  const { supabase, organizationId, userId } = await getActorContext();

  const productId = String(formData.get("productId") ?? "").trim();
  const revisionId = String(formData.get("revisionId") ?? "").trim();
  const revisionCode = String(formData.get("revisionCode") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const setAsCurrent = String(formData.get("setAsCurrent") ?? "") === "on";

  if (!productId || !revisionId || !revisionCode) {
    throw new Error("productId, revisionId and revisionCode are required");
  }

  const normalizedStatus = status || "draft";
  const releasedAt = normalizedStatus.toLowerCase() === "released" ? new Date().toISOString() : null;

  const { error: revisionError } = await supabase
    .from("product_revisions")
    .update({
      revision_code: revisionCode,
      status: normalizedStatus,
      summary: summary || null,
      released_at: releasedAt,
      released_by: releasedAt ? userId : null,
    })
    .eq("organization_id", organizationId)
    .eq("id", revisionId)
    .eq("product_id", productId);

  if (revisionError) {
    throw new Error(revisionError.message);
  }

  if (setAsCurrent) {
    const { error: productUpdateError } = await supabase
      .from("products")
      .update({ current_revision_id: revisionId })
      .eq("organization_id", organizationId)
      .eq("id", productId);

    if (productUpdateError) {
      throw new Error(productUpdateError.message);
    }
  }

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath(`/products/${productId}/revisions/${revisionId}`);
  revalidatePath("/boms");
  redirect(`/products/${productId}`);
}
