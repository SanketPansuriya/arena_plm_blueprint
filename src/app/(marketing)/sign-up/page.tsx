import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";

export default async function SignUpPage() {
  const access = await getAuthenticatedAppContext();

  if (access.status === "authorized") {
    redirect("/dashboard");
  }

  if (access.status === "unauthorized") {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-[#f7f4ec] px-6 py-10 text-slate-950 sm:px-10">
      <SignUpForm />
    </main>
  );
}
