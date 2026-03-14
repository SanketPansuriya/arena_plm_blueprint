"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type SignUpStatus =
  | { kind: "idle" }
  | { kind: "success"; message: string };

export function SignUpForm() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState<SignUpStatus>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setStatus({ kind: "idle" });
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_name: organizationName,
          job_title: jobTitle || null,
          role: "admin",
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setStatus({
      kind: "success",
      message:
        "Account created. Check your email to confirm the signup, then sign in to enter the workspace.",
    });
    setIsSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-slate-900/10 bg-white p-8 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-800">
        NextGen PLM
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.04em]">
        Create workspace access
      </h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        Start a new PLM workspace with an initial administrator account. Your signup
        provisions the organization profile used by the authenticated app.
      </p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Full name</span>
          <input
            autoComplete="name"
            className="w-full rounded-2xl border border-slate-900/10 bg-[#faf8f2] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700/35 focus:ring-4 focus:ring-teal-500/10"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jordan Lee"
            required
            type="text"
            value={fullName}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Organization</span>
          <input
            autoComplete="organization"
            className="w-full rounded-2xl border border-slate-900/10 bg-[#faf8f2] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700/35 focus:ring-4 focus:ring-teal-500/10"
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="Acme Medical Devices"
            required
            type="text"
            value={organizationName}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Job title</span>
          <input
            autoComplete="organization-title"
            className="w-full rounded-2xl border border-slate-900/10 bg-[#faf8f2] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700/35 focus:ring-4 focus:ring-teal-500/10"
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="Product Engineer"
            type="text"
            value={jobTitle}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            autoComplete="email"
            className="w-full rounded-2xl border border-slate-900/10 bg-[#faf8f2] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700/35 focus:ring-4 focus:ring-teal-500/10"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            autoComplete="new-password"
            className="w-full rounded-2xl border border-slate-900/10 bg-[#faf8f2] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700/35 focus:ring-4 focus:ring-teal-500/10"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Use at least 8 characters"
            required
            type="password"
            value={password}
          />
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {status.kind === "success" ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {status.message}
          </div>
        ) : null}

        <button
          className="w-full rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-65"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div className="mt-6 rounded-[1.5rem] border border-slate-900/8 bg-[#faf8f2] p-4 text-sm leading-6 text-slate-600">
        New signups create an organization workspace and a matching `public.users`
        profile through the Supabase auth provisioning trigger.
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Already have access?{" "}
        <Link className="font-semibold text-slate-950" href="/sign-in">
          Sign in
        </Link>
      </p>
    </div>
  );
}
