import Link from "next/link";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";
import { hasRoleAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type ChangeRequestRow = {
  id: string;
  change_number: string;
  title: string;
  status: string;
  submitted_at: string | null;
  approved_at: string | null;
  released_at: string | null;
  created_at: string;
};

type ApprovalRow = {
  change_request_id: string;
  status: string;
};

const approvalQueueRoles = ["admin", "approver"] as const;

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

function getStatusTone(status: string) {
  switch (status.toLowerCase()) {
    case "released":
    case "approved":
      return "success" as const;
    case "review":
    case "in_review":
    case "pending":
      return "warning" as const;
    case "draft":
      return "info" as const;
    case "rejected":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export default async function ChangesPage() {
  const access = await getAuthenticatedAppContext();

  if (access.status === "unauthenticated") {
    redirect("/sign-in");
  }

  if (access.status === "unauthorized") {
    redirect("/unauthorized");
  }

  if (!hasRoleAccess(access.user.role, approvalQueueRoles)) {
    redirect("/unauthorized");
  }

  const supabase = await createClient();
  const [{ data: changeRequestsData, error: changeRequestsError }, { data: approvalsData, error: approvalsError }] =
    await Promise.all([
      supabase
        .from("change_requests")
        .select(
          "id,change_number,title,status,submitted_at,approved_at,released_at,created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("approvals").select("change_request_id,status"),
    ]);

  const changeRequests = (changeRequestsData ?? []) as ChangeRequestRow[];
  const approvals = (approvalsData ?? []) as ApprovalRow[];

  const pendingByChangeId = new Map<string, number>();
  for (const approval of approvals) {
    if (approval.status.toLowerCase() !== "pending") {
      continue;
    }

    pendingByChangeId.set(
      approval.change_request_id,
      (pendingByChangeId.get(approval.change_request_id) ?? 0) + 1,
    );
  }

  const withApprovalSummary = changeRequests.map((changeRequest) => ({
    ...changeRequest,
    pendingApprovals: pendingByChangeId.get(changeRequest.id) ?? 0,
  }));

  const totalChanges = withApprovalSummary.length;
  const draftChanges = withApprovalSummary.filter(
    (item) => item.status.toLowerCase() === "draft",
  ).length;
  const releasedChanges = withApprovalSummary.filter(
    (item) => item.status.toLowerCase() === "released",
  ).length;

  return (
    <main className="space-y-6">
      <section className="rounded-[2.2rem] border border-slate-900/10 bg-white/85 p-7 shadow-[0_30px_80px_-58px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-teal-800">
              Execution
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              Approval queue
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Review change requests and monitor pending approval workload before release.
            </p>
          </div>
          <Link
            className="inline-flex rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/changes/new"
          >
            New change request
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:w-[30rem]">
          <div className="rounded-[1.5rem] border border-slate-900/10 bg-[#f8f6f1] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total changes
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {totalChanges}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-900/10 bg-amber-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
              Draft
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {draftChanges}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-900/10 bg-emerald-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Released
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {releasedChanges}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.9rem] border border-slate-900/10 bg-white/88 p-6 shadow-[0_24px_70px_-55px_rgba(15,23,42,0.45)] backdrop-blur">
        <DataTable
          columns={[
            {
              key: "change_number",
              header: "Change",
              render: (row) => (
                <div>
                  <p className="font-semibold text-slate-950">{row.change_number}</p>
                  <p className="mt-1 text-sm text-slate-600">{row.title}</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <StatusBadge
                  label={row.status.replaceAll("_", " ")}
                  tone={getStatusTone(row.status)}
                />
              ),
            },
            {
              key: "pending",
              header: "Pending approvals",
              render: (row) => row.pendingApprovals,
            },
            {
              key: "submitted",
              header: "Submitted",
              render: (row) => formatDate(row.submitted_at),
            },
            {
              key: "released",
              header: "Released",
              render: (row) => formatDate(row.released_at),
            },
          ]}
          emptyState={
            changeRequestsError || approvalsError
              ? "Approval queue could not be loaded from Supabase."
              : "No change requests found for this organization yet."
          }
          rows={withApprovalSummary}
        />
      </section>
    </main>
  );
}
