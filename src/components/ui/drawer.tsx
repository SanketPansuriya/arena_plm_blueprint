"use client";

import type { ReactNode } from "react";

export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
}: Readonly<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}>) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35 backdrop-blur-sm">
      <button
        aria-label="Close drawer"
        className="flex-1 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="h-full w-full max-w-xl overflow-y-auto border-l border-slate-900/10 bg-[#fcfbf7] p-6 shadow-[-30px_0_80px_-45px_rgba(15,23,42,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-900/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-teal-800">
              Drawer
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.04em]">
              {title}
            </h2>
            {description ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            ) : null}
          </div>

          <button
            className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}
