import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

function FieldShell({
  label,
  hint,
  children,
}: Readonly<{
  label: string;
  hint?: string;
  children: ReactNode;
}>) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const baseFieldClassName =
  "w-full rounded-2xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700/35 focus:ring-4 focus:ring-teal-500/10";

export function TextField({
  label,
  hint,
  ...props
}: Readonly<{ label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <FieldShell hint={hint} label={label}>
      <input {...props} className={`${baseFieldClassName} ${props.className ?? ""}`} />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  children,
  ...props
}: Readonly<
  { label: string; hint?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>
>) {
  return (
    <FieldShell hint={hint} label={label}>
      <select {...props} className={`${baseFieldClassName} ${props.className ?? ""}`}>
        {children}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  label,
  hint,
  ...props
}: Readonly<
  { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>
>) {
  return (
    <FieldShell hint={hint} label={label}>
      <textarea
        {...props}
        className={`${baseFieldClassName} min-h-28 resize-y ${props.className ?? ""}`}
      />
    </FieldShell>
  );
}
