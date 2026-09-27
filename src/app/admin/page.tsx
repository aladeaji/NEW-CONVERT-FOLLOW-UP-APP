import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dueLists } from "@/lib/followups";
import { attendanceConcerns } from "@/lib/attendance";
import { listCases } from "@/lib/pastoral";

const LEADERSHIP = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR", "PASTOR"];

export default async function AdminPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");
  if (!LEADERSHIP.includes(me.role)) redirect("/today");

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const [
    newPeople,
    unassigned,
    lists,
    concerns,
    cases,
    integrated,
    attending,
    workers,
  ] = await Promise.all([
    db.person.count({
      where: { churchId: me.churchId, createdAt: { gte: weekAgo } },
    }),
    db.person.count({
      where: { churchId: me.churchId, assignedWorkerId: null },
    }),
    dueLists({ churchId: me.churchId }),
    attendanceConcerns(me.churchId),
    listCases(me.churchId, "OPEN"),
    db.person.count({
      where: {
        churchId: me.churchId,
        journeyStage: { in: ["INTEGRATED", "ACTIVE_MEMBER"] },
      },
    }),
    db.person.count({
      where: {
        churchId: me.churchId,
        journeyStage: { in: ["ATTENDING", "GROWING", "CONNECTED"] },
      },
    }),
    db.user.findMany({
      where: { churchId: me.churchId, active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const cards: [string, number, string][] = [
    ["New this week", newPeople, "/people"],
    ["Unassigned", unassigned, "/unassigned"],
    ["Overdue", lists.overdue.length, "/follow-ups"],
    ["Due today", lists.dueToday.length, "/follow-ups"],
    ["Awaiting contact", lists.awaiting.length, "/follow-ups"],
    ["Attendance concerns", concerns.length, "/attendance"],
    ["Pastoral cases", cases.length, "/pastoral"],
    ["Attending / growing", attending, "/people"],
    ["Integrated", integrated, "/people"],
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
        Church health
      </p>
      <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A]">
        Dashboard
      </h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map(([label, n, href]) => (
          <Link key={label} href={href} className="rounded-[10px] bg-white p-4">
            <p className="text-2xl font-extrabold">{n}</p>
            <p className="text-[13px] text-slate-500">{label}</p>
          </Link>
        ))}
      </div>
      <h2 className="mt-6 font-bold text-[#1A2B4A]">
        Workers ({workers.length})
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {workers.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between rounded-[10px] bg-white p-4"
          >
            <span className="font-semibold">{w.name}</span>
            <span className="text-sm text-slate-500">
              {w.role.replace(/_/g, " ")}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
