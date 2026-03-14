import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { SignOutForm } from "@/components/auth/sign-out-form";
import { getAuthenticatedAppContext } from "@/lib/auth/get-authenticated-app-context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await getAuthenticatedAppContext();

  if (access.status === "unauthenticated") {
    redirect("/sign-in");
  }

  if (access.status === "unauthorized") {
    redirect("/unauthorized");
  }

  return (
    <AppShell headerAction={<SignOutForm />} user={access.user}>
      {children}
    </AppShell>
  );
}
