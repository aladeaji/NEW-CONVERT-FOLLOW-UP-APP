import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { listCases } from "@/lib/pastoral";
import ResolveForm from "./ResolveForm";

const LEADERSHIP = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR", "PASTOR"];

export default async function PastoralPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");
  if (!LEADERSHIP.includes(me.role)) redirect("/today");

  const cases = await listCases(me.churchId, "OPEN");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">
        Pastoral attention ({cases.length})
      </h1>
      <div className="mt-4 flex flex-col gap-2">
        {cases.map((c) => (
          <div key={c.id} className="rounded-[10px] bg-white p-4">
            <Link
              href={`/people/${c.person.id}`}
              className="font-bold text-[#1A2B4A] underline"
            >
              {c.person.fullName}
            </Link>
            <p className="text-sm">{c.reason}</p>
            <p className="text-sm text-slate-500">
              Raised by {c.raiser.name} ·{" "}
              {new Date(c.createdAt).toLocaleDateString()}
            </p>
            <ResolveForm caseId={c.id} />
          </div>
        ))}
        {cases.length === 0 && (
          <p className="rounded-[10px] bg-white p-6 text-center text-sm text-slate-500">
            No open pastoral cases.
          </p>
        )}
      </div>
    </main>
  );
}
