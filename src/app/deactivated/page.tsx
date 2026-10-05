import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function DeactivatedPage() {
  const session = await getSession();
  if (!session?.user)
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <Link href="/sign-in" className="font-semibold text-[#1A2B4A] underline">
          Sign in
        </Link>
      </main>
    );
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">
        Account deactivated
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Your worker account is currently inactive. Please contact your church
        administrator.
      </p>
    </main>
  );
}
