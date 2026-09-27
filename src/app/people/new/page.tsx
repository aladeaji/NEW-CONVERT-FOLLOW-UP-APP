import { redirect } from "next/navigation";
import NewPersonForm from "./NewPersonForm";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export default async function NewPersonPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">Register person</h1>
      <p className="mt-1 text-sm text-slate-500">
        Keep it short — enough to begin caring, details come later.
      </p>
      <div className="mt-6">
        <NewPersonForm />
      </div>
    </main>
  );
}
