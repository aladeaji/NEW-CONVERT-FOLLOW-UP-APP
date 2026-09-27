import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dueLists } from "@/lib/followups";

export default async function TodayPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const churchWide = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"].includes(me.role);
  const scope = {
    churchId: me.churchId,
    workerId: churchWide ? undefined : me.id,
  };
  const { overdue, dueToday, upcoming, awaiting } = await dueLists(scope);
  const unassigned = churchWide
    ? await db.person.count({
        where: { churchId: me.churchId, assignedWorkerId: null },
      })
    : 0;

  const cards: [string, number, string][] = [
    ["Due today", dueToday.length, "/follow-ups"],
    ["Overdue", overdue.length, "/follow-ups"],
    ["Awaiting contact", awaiting.length, "/follow-ups"],
    ["Upcoming", upcoming.length, "/follow-ups"],
  ];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
        Today
      </p>
      <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A]">
        Who needs your attention?
      </h1>
      {churchWide && unassigned > 0 && (
        <Link
          href="/unassigned"
          className="mt-3 block rounded-[10px] bg-red-50 p-4 font-semibold text-red-700"
        >
          {unassigned} unassigned — assign every person a worker →
        </Link>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([label, n, href]) => (
          <Link key={label} href={href} className="rounded-[10px] bg-white p-4">
            <p className="text-2xl font-extrabold">{n}</p>
            <p className="text-[13px] text-slate-500">{label}</p>
          </Link>
        ))}
      </div>
      {overdue.slice(0, 5).map((p) => (
        <Link
          key={p.id}
          href={`/people/${p.id}`}
          className="mt-2 block rounded-[10px] bg-white p-4"
        >
          <p className="font-bold">{p.fullName}</p>
          <p className="text-sm text-slate-500">
            {p.nextAction ?? "Overdue follow-up"}
          </p>
        </Link>
      ))}
    </main>
  );
}
