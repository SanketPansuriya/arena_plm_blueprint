"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createChangeRequest } from "@/app/(app)/changes/actions";

type CreateChangeRequestState = {
  status: "idle" | "success" | "error";
  message: string | null;
  changeRequestId?: string;
  changeNumber?: string;
};

const initialState: CreateChangeRequestState = {
  status: "idle",
  message: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
      disabled={pending}
      type="submit"
    >
      {pending ? "Creating..." : "Create Change Request"}
    </button>
  );
}

export function ChangeRequestCreateForm({
  entityType,
  entityId,
  beforeRevision,
  defaultTitle,
}: Readonly<{
  entityType: "product" | "part";
  entityId: string;
  beforeRevision: string | null;
  defaultTitle: string;
}>) {
  const [state, formAction] = useActionState(createChangeRequest, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="entityType" type="hidden" value={entityType} />
      <input name="entityId" type="hidden" value={entityId} />
      <input name="beforeRevision" type="hidden" value={beforeRevision ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-600">
          Title
          <input
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
            defaultValue={defaultTitle}
            name="title"
            required
            type="text"
          />
        </label>

        <label className="block text-sm text-slate-600">
          Reason
          <input
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
            name="reason"
            placeholder="Supplier update, defect fix, cost reduction"
            type="text"
          />
        </label>
      </div>

      <label className="block text-sm text-slate-600">
        Description
        <textarea
          className="mt-1.5 block min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
          name="description"
          placeholder="Describe the proposed change in detail"
        />
      </label>

      <label className="block text-sm text-slate-600">
        Impact summary
        <textarea
          className="mt-1.5 block min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900"
          name="impactSummary"
          placeholder="Outline impact on cost, schedule, compliance, or quality"
        />
      </label>

      <div className="flex items-center gap-3">
        <SubmitButton />
        {beforeRevision ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Baseline revision {beforeRevision}
          </span>
        ) : null}
      </div>

      {state.message ? (
        <p
          className={`text-sm ${
            state.status === "success" ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
