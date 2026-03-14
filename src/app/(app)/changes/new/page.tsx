import Link from "next/link";
import { redirect } from "next/navigation";

import { ChangeRequestCreateForm } from "@/components/app/change-request-create-form";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type ProductContext = {
  id: string;
  name: string;
  product_code: string;
  current_revision_id: string | null;
};

type PartContext = {
  id: string;
  name: string;
  part_number: string;
  current_revision_id: string | null;
};

type RevisionContext = {
  revision_code: string;
};

const changeRoles = ["admin", "engineer", "approver"] as const;

function getContextTone(entityType: "product" | "part") {
  return entityType === "product" ? "info" : "warning";
}

export default async function ChangeRequestNewPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const access = await getAuthenticatedAppContext();

  if (access.status === "unauthenticated") {
    redirect("/sign-in");
  }

  if (access.status === "unauthorized") {
    redirect("/unauthorized");
  }

  if (!hasRoleAccess(access.user.role, changeRoles)) {
    redirect("/unauthorized");
  }

  const resolvedParams = await searchParams;
  const entityTypeRaw = resolvedParams.entityType;
  const entityIdRaw = resolvedParams.entityId;

  const entityType =
    entityTypeRaw === "product" || entityTypeRaw === "part" ? entityTypeRaw : null;
  const entityId = typeof entityIdRaw === "string" && entityIdRaw.trim() ? entityIdRaw : null;

  if (!entityType || !entityId) {
    return (
      <main className="space-y-6">
        <section className="rounded-[1.9rem] border border-amber-900/15 bg-amber-50/70 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
            Change initiation
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
            Missing entity context
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Start this flow from a product or part detail page to prefill the
            impacted record context.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
              href="/products"
            >
              Open Products
            </Link>
            <Link
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
              href="/parts"
            >
              Open Parts
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const supabase = await createClient();

  if (entityType === "product") {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id,name,product_code,current_revision_id")
      .eq("id", entityId)
      .maybeSingle<ProductContext>();

    if (productError || !product) {
      return (
        <main className="space-y-6">
          <section className="rounded-[1.9rem] border border-rose-900/15 bg-rose-50/70 p-6">
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
              Product context is unavailable
            </h1>
            <p className="mt-3 text-sm text-slate-700">
              The selected product could not be loaded.
            </p>
          </section>
        </main>
      );
    }

    const currentRevision = product.current_revision_id
      ? (
          await supabase
            .from("product_revisions")
            .select("revision_code")
            .eq("id", product.current_revision_id)
            .maybeSingle<RevisionContext>()
        ).data
      : null;

    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-slate-900/10 bg-white/88 p-6 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-800">
            Changes
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
            Create change request
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StatusBadge label="product context" tone={getContextTone("product")} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {product.product_code}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            You are creating a request for product <strong>{product.name}</strong>.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-900/10 bg-white/88 p-6 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)]">
          <ChangeRequestCreateForm
            beforeRevision={currentRevision?.revision_code ?? null}
            defaultTitle={`Change request for ${product.name}`}
            entityId={product.id}
            entityType="product"
          />
        </section>
      </main>
    );
  }

  const { data: part, error: partError } = await supabase
    .from("parts")
    .select("id,name,part_number,current_revision_id")
    .eq("id", entityId)
    .maybeSingle<PartContext>();

  if (partError || !part) {
    return (
      <main className="space-y-6">
        <section className="rounded-[1.9rem] border border-rose-900/15 bg-rose-50/70 p-6">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            Part context is unavailable
          </h1>
          <p className="mt-3 text-sm text-slate-700">
            The selected part could not be loaded.
          </p>
        </section>
      </main>
    );
  }

  const currentRevision = part.current_revision_id
    ? (
        await supabase
          .from("part_revisions")
          .select("revision_code")
          .eq("id", part.current_revision_id)
          .maybeSingle<RevisionContext>()
      ).data
    : null;

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-900/10 bg-white/88 p-6 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-800">
          Changes
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-slate-950">
          Create change request
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge label="part context" tone={getContextTone("part")} />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {part.part_number}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          You are creating a request for part <strong>{part.name}</strong>.
        </p>
      </section>

      <section className="rounded-[2rem] border border-slate-900/10 bg-white/88 p-6 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)]">
        <ChangeRequestCreateForm
          beforeRevision={currentRevision?.revision_code ?? null}
          defaultTitle={`Change request for ${part.name}`}
          entityId={part.id}
          entityType="part"
        />
      </section>
    </main>
  );
}
