import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function TodayPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const assignedCount = await db.person.count({
    where: { churchId: me.churchId, assignedWorkerId: me.id },
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
        Today
      </p>
      <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A]">
        Who needs your attention?
      </h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Due today", "0"],
          ["Overdue", "0"],
          ["Awaiting contact", String(assignedCount)],
          ["Concerns", "0"],
        ].map(([label, n]) => (
          <div key={label} className="rounded-[10px] bg-white p-4">
            <p className="text-2xl font-extrabold">{n}</p>
            <p className="text-[13px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-[10px] bg-white p-6">
        <h2 className="font-bold">My people ({assignedCount})</h2>
        {assignedCount === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nothing assigned yet. New converts you are responsible for will
            appear here.
          </p>
        ) : null}
      </div>
    </main>
  );
}
