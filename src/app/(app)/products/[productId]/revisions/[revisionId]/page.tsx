import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updateProductRevision } from "@/app/(app)/products/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type ProductRecord = {
  id: string;
  name: string;
  product_code: string;
  current_revision_id: string | null;
};

type ProductRevisionRecord = {
  id: string;
  product_id: string;
  revision_code: string;
  status: string;
  summary: string | null;
};

const productPageRoles = ["admin", "engineer", "approver"] as const;

function getStatusTone(status: string) {
  switch (status.toLowerCase()) {
    case "released":
    case "approved":
      return "success" as const;
    case "review":
    case "in_review":
      return "warning" as const;
    case "draft":
      return "info" as const;
    default:
      return "default" as const;
  }
}

export default async function ProductRevisionEditPage({
  params,
}: Readonly<{
  params: Promise<{ productId: string; revisionId: string }>;
}>) {
  const access = await getAuthenticatedAppContext();

  if (access.status === "unauthenticated") {
    redirect("/sign-in");
  }

  if (access.status === "unauthorized") {
    redirect("/unauthorized");
  }

  if (!hasRoleAccess(access.user.role, productPageRoles)) {
    redirect("/unauthorized");
  }

  const { productId, revisionId } = await params;
  const supabase = await createClient();

  const [{ data: product, error: productError }, { data: revision, error: revisionError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id,name,product_code,current_revision_id")
        .eq("id", productId)
        .maybeSingle<ProductRecord>(),
      supabase
        .from("product_revisions")
        .select("id,product_id,revision_code,status,summary")
        .eq("id", revisionId)
        .eq("product_id", productId)
        .maybeSingle<ProductRevisionRecord>(),
    ]);

  if (productError || revisionError) {
    throw new Error(productError?.message || revisionError?.message || "Failed to load revision");
  }

  if (!product || !revision) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-900/10 bg-white/88 p-6 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Product revision
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Edit revision {revision.revision_code}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {product.product_code} - {product.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              label={revision.status.replaceAll("_", " ")}
              tone={getStatusTone(revision.status)}
            />
            {product.current_revision_id === revision.id ? (
              <StatusBadge label="current" tone="success" />
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-slate-900/10 bg-white/88 p-6 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)] backdrop-blur">
        <form action={updateProductRevision} className="space-y-4">
          <input name="productId" type="hidden" value={product.id} />
          <input name="revisionId" type="hidden" value={revision.id} />

          <label className="block text-sm text-slate-600">
            Revision code
            <input
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
              defaultValue={revision.revision_code}
              name="revisionCode"
              required
              type="text"
            />
          </label>

          <label className="block text-sm text-slate-600">
            Status
            <select
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
              defaultValue={revision.status}
              name="status"
            >
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="released">Released</option>
            </select>
          </label>

          <label className="block text-sm text-slate-600">
            Summary
            <textarea
              className="mt-1.5 block min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800"
              defaultValue={revision.summary ?? ""}
              name="summary"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              className="h-4 w-4 rounded border-slate-300 text-slate-900"
              defaultChecked={product.current_revision_id === revision.id}
              name="setAsCurrent"
              type="checkbox"
            />
            Set as current revision
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              type="submit"
            >
              Save revision
            </button>
            <Link
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              href={`/products/${product.id}`}
            >
              Back to product
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
