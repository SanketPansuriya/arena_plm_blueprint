type StatusTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

const toneClasses: Record<StatusTone, string> = {
  default: "bg-slate-900/6 text-slate-700",
  success: "bg-emerald-500/12 text-emerald-800",
  warning: "bg-amber-500/14 text-amber-800",
  danger: "bg-rose-500/12 text-rose-800",
  info: "bg-sky-500/12 text-sky-800",
};

export function StatusBadge({
  label,
  tone = "default",
}: Readonly<{
  label: string;
  tone?: StatusTone;
}>) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
