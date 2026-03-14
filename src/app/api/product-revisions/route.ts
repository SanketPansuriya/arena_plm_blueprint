import { NextResponse } from "next/server";

import { jsonCreated, jsonError, requireApiActor } from "@/lib/api/route-auth";
import { createClient } from "@/lib/supabase/server";

type ProductRevisionCreatePayload = {
  product_id?: string;
  revision_code?: string;
  status?: string;
  summary?: string | null;
  released_at?: string | null;
  released_by?: string | null;
  set_as_current?: boolean;
};

const productRevisionMutationRoles = ["admin", "engineer", "approver"] as const;

export async function GET(request: Request) {
  const auth = await requireApiActor();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("product_id")?.trim();

  const supabase = await createClient();
  let query = supabase
    .from("product_revisions")
    .select(
      "id,product_id,revision_code,status,summary,released_at,released_by,created_at,updated_at",
    )
    .eq("organization_id", auth.actor.organizationId);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    return jsonError(error.message, 500);
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireApiActor(productRevisionMutationRoles);
  if (!auth.ok) {
    return auth.response;
  }

  let payload: ProductRevisionCreatePayload;
  try {
    payload = (await request.json()) as ProductRevisionCreatePayload;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!payload.product_id?.trim() || !payload.revision_code?.trim()) {
    return jsonError("product_id and revision_code are required", 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_revisions")
    .insert({
      organization_id: auth.actor.organizationId,
      product_id: payload.product_id.trim(),
      revision_code: payload.revision_code.trim(),
      status: payload.status?.trim() || "draft",
      summary: payload.summary ?? null,
      released_at: payload.released_at ?? null,
      released_by: payload.released_by ?? null,
    })
    .select(
      "id,product_id,revision_code,status,summary,released_at,released_by,created_at,updated_at",
    )
    .single();

  if (error) {
    return jsonError(error.message, 400);
  }

  if (payload.set_as_current) {
    const { error: productUpdateError } = await supabase
      .from("products")
      .update({ current_revision_id: data.id })
      .eq("organization_id", auth.actor.organizationId)
      .eq("id", data.product_id);

    if (productUpdateError) {
      return jsonError(
        `Revision created but failed to set product current revision: ${productUpdateError.message}`,
        400,
      );
    }
  }

  return jsonCreated({ data });
}
