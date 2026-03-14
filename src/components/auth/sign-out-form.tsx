import { signOut } from "@/app/(app)/actions";

export function SignOutForm({
  className,
}: Readonly<{
  className?: string;
}>) {
  return (
    <form action={signOut}>
      <button className={className} type="submit">
        Sign out
      </button>
    </form>
  );
}
