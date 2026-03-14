import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ec] px-6 py-10 text-slate-950 sm:px-10">
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-slate-900/10 bg-white p-8 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
          Access denied
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em]">
          You do not have permission to access this workspace.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
          Your account is signed in, but it does not have one of the supported app
          roles required for this area. Ask an administrator to assign `admin`,
          `engineer`, `approver`, or `supplier` access.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/sign-in"
          >
            Back to sign in
          </Link>
          <Link
            className="rounded-full border border-slate-900/10 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            href="/"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
