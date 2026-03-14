import { UiShowcase } from "@/components/app/ui-showcase";

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-slate-900/10 bg-white p-8 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-800">
          Authenticated App
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em]">
          Shared application shell initialized
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          The top navigation and module sidebar are now in place for authenticated
          pages. Dashboard content, data cards, and activity details remain separate
          tracked tasks.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
          <p className="text-sm font-medium text-slate-500">Navigation</p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">
            Persistent top bar
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Includes workspace branding, search placeholder, organization label, and
            user identity.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
          <p className="text-sm font-medium text-slate-500">Sidebar</p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">
            Module navigation
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Organizes the app into overview, product data, and execution modules.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-900/10 bg-white p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
          <p className="text-sm font-medium text-slate-500">Routing</p>
          <p className="mt-3 text-lg font-semibold tracking-[-0.03em]">
            Ready for expansion
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Future authenticated routes can drop into the shell without rebuilding the
            layout structure.
          </p>
        </div>
      </section>

      <UiShowcase />
    </main>
  );
}
