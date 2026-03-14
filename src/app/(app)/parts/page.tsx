import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type PartRevision = {
  revision_code: string;
  status: string;
  released_at: string | null;
};

type PartRow = {
  id: string;
  part_number: string;
  name: string;
  description: string | null;
  part_type: string | null;
  unit_of_measure: string | null;
  lifecycle_status: string;
  current_revision: PartRevision | PartRevision[] | null;
};

const partPageRoles = ["admin", "engineer", "approver"] as const;

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

function normalizeRevision(revision: PartRow["current_revision"]) {
  if (Array.isArray(revision)) {
    return revision[0] ?? null;
  }

  return revision;
}

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

export default async function PartsPage() {
  const access = await getAuthenticatedAppContext();

  if (access.status === "unauthenticated") {
    redirect("/sign-in");
  }

  if (access.status === "unauthorized") {
    redirect("/unauthorized");
  }

  if (!hasRoleAccess(access.user.role, partPageRoles)) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parts")
    .select(
      `
        id,
        part_number,
        name,
        description,
        part_type,
        unit_of_measure,
        lifecycle_status,
        current_revision:part_revisions!parts_current_revision_id_fkey (
          revision_code,
          status,
          released_at
        )
      `,
    )
    .order("updated_at", { ascending: false });

  const parts = ((data ?? []) as PartRow[]).map((part) => ({
    ...part,
    currentRevision: normalizeRevision(part.current_revision),
  }));

  const totalParts = parts.length;
  const assemblyParts = parts.filter(
    (part) => (part.part_type ?? "").toLowerCase() === "assembly",
  ).length;
  const releasedParts = parts.filter(
    (part) => part.lifecycle_status.toLowerCase() === "released",
  ).length;

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white p-8 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_52%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_54%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-800">
              Part library
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em] text-slate-950">
              Reusable component records with revision-aware inventory context.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
              Parts are organized for reuse across products and BOMs, with current
              revision visibility, release state, and component typing ready for
              downstream engineering review.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[31rem]">
            <div className="rounded-[1.5rem] border border-slate-900/10 bg-[#fcfaf5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Total parts
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {formatCount(totalParts)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-900/10 bg-amber-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                Assemblies
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {formatCount(assemblyParts)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-900/10 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Released
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                {formatCount(releasedParts)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 rounded-[1.5rem] border border-slate-900/8 bg-[#faf8f2] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              label={error ? "connection issue" : "reusable inventory"}
              tone={error ? "warning" : "success"}
            />
            <p className="text-sm text-slate-600">
              {error
                ? "Supabase query returned an error. The shell remains available, but part rows could not be loaded."
                : "Current part revisions and release states are being pulled directly from your controlled records."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-3 border-b border-slate-900/8 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Library list</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Controlled parts
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              This list is the foundation for reuse workflows, BOM assembly, and later
              duplicate detection or preferred-part guidance.
            </p>
          </div>

          <div className="mt-5">
            <DataTable
              columns={[
                {
                  key: "part",
                  header: "Part",
                  render: (row) => (
                    <div>
                      <Link
                        className="font-semibold text-slate-950 transition hover:text-teal-700"
                        href={`/parts/${row.id}`}
                      >
                        {row.name}
                      </Link>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {row.part_number}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "type",
                  header: "Type",
                  render: (row) => row.part_type || "Unassigned",
                },
                {
                  key: "uom",
                  header: "UOM",
                  render: (row) => row.unit_of_measure || "N/A",
                },
                {
                  key: "lifecycle",
                  header: "Lifecycle",
                  render: (row) => (
                    <StatusBadge
                      label={row.lifecycle_status.replaceAll("_", " ")}
                      tone={getStatusTone(row.lifecycle_status)}
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
                          tone={getStatusTone(row.currentRevision.status)}
                        />
                      ) : null}
                    </div>
                  ),
                },
                {
                  key: "released",
                  header: "Release date",
                  render: (row) => formatDate(row.currentRevision?.released_at ?? null),
                },
              ]}
              emptyState={
                error
                  ? "Parts could not be loaded from Supabase."
                  : "No parts found for this organization yet."
              }
              rows={parts}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-medium text-slate-500">Why this matters</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Part reuse drives faster release
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Teams can review release state and revision freshness before using a part
              in new product structures or engineering changes.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-900/10 bg-[#fcfaf5] p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.2)]">
            <p className="text-sm font-medium text-slate-500">Next in flow</p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Linked usages and BOM context
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The detail page expands this library entry into revision history and where
              the current revision is consumed.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
