import { signOut } from "@/app/(app)/actions";

export function SignOutForm() {
  return (
    <form action={signOut}>
      <button
        className="rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
