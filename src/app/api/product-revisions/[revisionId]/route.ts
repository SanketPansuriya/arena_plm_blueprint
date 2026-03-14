import { NextResponse } from "next/server";

import { jsonError, requireApiActor } from "@/lib/api/route-auth";
import { createClient } from "@/lib/supabase/server";

type ProductRevisionUpdatePayload = {
  revision_code?: string;
  status?: string;
  summary?: string | null;
  released_at?: string | null;
  released_by?: string | null;
  set_as_current?: boolean;
};

const productRevisionMutationRoles = ["admin", "engineer", "approver"] as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> },
) {
  const auth = await requireApiActor();
  if (!auth.ok) {
    return auth.response;
  }

  const { revisionId } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_revisions")
    .select(
      "id,product_id,revision_code,status,summary,released_at,released_by,created_at,updated_at",
    )
    .eq("organization_id", auth.actor.organizationId)
    .eq("id", revisionId)
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!data) {
    return jsonError("Product revision not found", 404);
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ revisionId: string }> },
) {
  const auth = await requireApiActor(productRevisionMutationRoles);
  if (!auth.ok) {
    return auth.response;
  }

  const { revisionId } = await context.params;

  let payload: ProductRevisionUpdatePayload;
  try {
    payload = (await request.json()) as ProductRevisionUpdatePayload;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const updates: Record<string, unknown> = {};

  if (typeof payload.revision_code === "string") {
    updates.revision_code = payload.revision_code.trim();
  }

  if (typeof payload.status === "string") {
    updates.status = payload.status.trim();
  }

  if (payload.summary !== undefined) {
    updates.summary = payload.summary;
  }

  if (payload.released_at !== undefined) {
    updates.released_at = payload.released_at;
  }

  if (payload.released_by !== undefined) {
    updates.released_by = payload.released_by;
  }

  const supabase = await createClient();
  let data:
    | {
        id: string;
        product_id: string;
        revision_code: string;
        status: string;
        summary: string | null;
        released_at: string | null;
        released_by: string | null;
        created_at: string;
        updated_at: string;
      }
    | null = null;
  let error: { message: string } | null = null;

  if (Object.keys(updates).length > 0) {
    const result = await supabase
      .from("product_revisions")
      .update(updates)
      .eq("organization_id", auth.actor.organizationId)
      .eq("id", revisionId)
      .select(
        "id,product_id,revision_code,status,summary,released_at,released_by,created_at,updated_at",
      )
      .maybeSingle();
    data = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from("product_revisions")
      .select(
        "id,product_id,revision_code,status,summary,released_at,released_by,created_at,updated_at",
      )
      .eq("organization_id", auth.actor.organizationId)
      .eq("id", revisionId)
      .maybeSingle();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return jsonError(error.message, 400);
  }

  if (!data) {
    return jsonError("Product revision not found", 404);
  }

  if (payload.set_as_current) {
    const { error: productUpdateError } = await supabase
      .from("products")
      .update({ current_revision_id: data.id })
      .eq("organization_id", auth.actor.organizationId)
      .eq("id", data.product_id);

    if (productUpdateError) {
      return jsonError(
        `Revision updated but failed to set product current revision: ${productUpdateError.message}`,
        400,
      );
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> },
) {
  const auth = await requireApiActor(productRevisionMutationRoles);
  if (!auth.ok) {
    return auth.response;
  }

  const { revisionId } = await context.params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_revisions")
    .delete()
    .eq("organization_id", auth.actor.organizationId)
    .eq("id", revisionId)
    .select("id")
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 400);
  }

  if (!data) {
    return jsonError("Product revision not found", 404);
  }

  return NextResponse.json({ success: true, id: data.id });
}
