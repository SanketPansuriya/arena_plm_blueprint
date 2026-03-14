import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type ProductRevision = {
  revision_code: string;
  status: string;
  released_at: string | null;
};

type ProductRow = {
  id: string;
  product_code: string;
  name: string;
  description: string | null;
  category: string | null;
  lifecycle_status: string;
  created_at: string;
  current_revision: ProductRevision | ProductRevision[] | null;
};

const productPageRoles = ["admin", "engineer", "approver"] as const;

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeRevision(revision: ProductRow["current_revision"]) {
  if (Array.isArray(revision)) {
    return revision[0] ?? null;
  }

  return revision;
}

function getLifecycleTone(status: string) {
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

function getRevisionTone(status: string | null | undefined) {
  if (!status) {
    return "default" as const;
  }

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

export default async function ProductsPage() {
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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        product_code,
        name,
        description,
        category,
        lifecycle_status,
        created_at,
        current_revision:product_revisions!products_current_revision_id_fkey (
          revision_code,
          status,
          released_at
        )
      `,
    )
    .order("updated_at", { ascending: false });

  const products = ((data ?? []) as ProductRow[]).map((product) => {
    const revision = normalizeRevision(product.current_revision);

    return {
      ...product,
      currentRevision: revision,
    };
  });

  const totalProducts = products.length;
  const releasedProducts = products.filter(
    (product) => product.lifecycle_status.toLowerCase() === "released",
  ).length;
  const reviewProducts = products.filter(
    (product) => product.lifecycle_status.toLowerCase() === "review",
  ).length;
  const trackedCategories = new Set(
    products
      .map((product) => product.category?.trim())
      .filter((category): category is string => Boolean(category)),
  ).size;

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white p-8 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_58%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_52%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-800">
              Product data
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em] text-slate-950">
              Controlled product records with revision-aware visibility.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              This page surfaces the active catalog for your organization, including
              lifecycle state, current revision, and release timing. It is wired for
              live Supabase reads so later detail views can build on the same data path.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[31rem]">
            <div className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Total products
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {formatCount(totalProducts)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-900/10 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Released
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {formatCount(releasedProducts)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-900/10 bg-amber-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                In review
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {formatCount(reviewProducts)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-[1.5rem] border border-slate-900/8 bg-[#faf8f2] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                label={error ? "connection issue" : "live catalog"}
                tone={error ? "warning" : "success"}
              />
              <p className="text-sm text-slate-600">
                {error
                  ? "Supabase query returned an error. The page stays available, but product rows could not be loaded."
                  : "Current revision metadata is being pulled directly from the active product records table."}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-900/8 bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
              Category spread
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              {formatCount(trackedCategories)}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Distinct product categories currently represented in the organization
              workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-3 border-b border-slate-900/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Catalog list</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Organization products
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Detail pages are tracked next. This list establishes the shared query,
              summary, and status language for product browsing.
            </p>
          </div>

          <div className="mt-5">
            <DataTable
              columns={[
                {
                  key: "product",
                  header: "Product",
                  render: (row) => (
                    <div>
                      <Link
                        className="font-semibold text-slate-950 transition hover:text-teal-700"
                        href={`/products/${row.id}`}
                      >
                        {row.name}
                      </Link>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {row.product_code}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "category",
                  header: "Category",
                  render: (row) => row.category || "Unassigned",
                },
                {
                  key: "lifecycle",
                  header: "Lifecycle",
                  render: (row) => (
                    <StatusBadge
                      label={row.lifecycle_status.replaceAll("_", " ")}
                      tone={getLifecycleTone(row.lifecycle_status)}
                    />
                  ),
                },
                {
                  key: "revision",
                  header: "Current revision",
                  render: (row) => (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {row.currentRevision?.revision_code ?? "None"}
                      </span>
                      {row.currentRevision ? (
                        <StatusBadge
                          label={row.currentRevision.status.replaceAll("_", " ")}
                          tone={getRevisionTone(row.currentRevision.status)}
                        />
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "release",
                  header: "Release date",
                  render: (row) => formatDate(row.currentRevision?.released_at ?? null),
                },
              ]}
              emptyState={
                error
                  ? "Products could not be loaded from Supabase."
                  : "No products found for this organization yet."
              }
              rows={products}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-medium text-slate-500">Page intent</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Built for quick program review
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Engineering, approvers, and admins get a clean read on which products are
              draft, under review, or released before drilling into revisions.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-900/10 bg-[#fcfaf5] p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-medium text-slate-500">Next in sequence</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Product detail page with revision history
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The next task can reuse this data source and expand it into revision
              timeline, linked documents, BOM context, and release-ready details.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
