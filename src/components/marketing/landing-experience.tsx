const features = [
  {
    title: "Product records",
    description: "Manage products, parts, BOMs, and revisions from one place.",
  },
  {
    title: "Change control",
    description: "Track approvals, release decisions, and audit history.",
  },
  {
    title: "Supplier collaboration",
    description: "Share approved drawings and documents with external teams.",
  },
];

export function LandingExperience() {
  return (
    <main className="min-h-screen bg-[#f7f4ec] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-5 border-b border-slate-900/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-800">
              NextGen PLM
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Cloud-native product lifecycle management
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              className="rounded-full border border-slate-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              href="/sign-in"
            >
              Sign in
            </a>
            <a
              className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              href="/sign-up"
            >
              Sign up
            </a>
          </div>
        </header>

        <section className="grid flex-1 gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-teal-900/10 bg-teal-700/10 px-4 py-2 text-sm font-medium text-teal-900">
              Built for engineering, quality, and operations teams
            </p>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl font-semibold leading-[0.96] tracking-[-0.05em] sm:text-6xl">
              Keep product data, revisions, and approvals in sync.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
              NextGen PLM helps teams manage products, BOMs, documents, CAD
              references, and change workflows in one connected system.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                href="/sign-up"
              >
                Get started
              </a>
              <a
                className="rounded-full border border-slate-900/10 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                href="/sign-in"
              >
                Sign in
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-900/10 bg-white p-6 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
            <p className="text-sm font-medium text-slate-500">Platform overview</p>
            <div className="mt-6 space-y-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[1.25rem] border border-slate-900/8 bg-[#faf8f2] p-4"
                >
                  <h2 className="text-lg font-semibold tracking-[-0.03em]">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
