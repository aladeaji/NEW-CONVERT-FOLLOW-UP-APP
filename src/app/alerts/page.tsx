import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dueLists } from "@/lib/followups";
import { attendanceConcerns } from "@/lib/attendance";
import { listCases } from "@/lib/pastoral";

export default async function AlertsPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const churchWide = me.role !== "WORKER";
  const scope = {
    churchId: me.churchId,
    workerId: churchWide ? undefined : me.id,
  };
  const [lists, concerns, cases, unassigned] = await Promise.all([
    dueLists(scope),
    attendanceConcerns(me.churchId),
    churchWide ? listCases(me.churchId, "OPEN") : Promise.resolve([]),
    churchWide
      ? db.person.count({
          where: { churchId: me.churchId, assignedWorkerId: null },
        })
      : Promise.resolve(0),
  ]);

  const alerts: [string, number, string][] = [
    ["Overdue follow-ups", lists.overdue.length, "/follow-ups"],
    ["Due today", lists.dueToday.length, "/follow-ups"],
    ["Awaiting first contact", lists.awaiting.length, "/follow-ups"],
    ["Attendance concerns", concerns.length, "/attendance"],
  ];
  if (churchWide) {
    alerts.push(
      ["Unassigned people", unassigned, "/unassigned"],
      ["Pastoral cases", cases.length, "/pastoral"],
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">Alerts</h1>
      <div className="mt-4 flex flex-col gap-2">
        {alerts.map(([label, n, href]) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between rounded-[10px] bg-white p-4"
          >
            <span className="font-semibold">{label}</span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                n > 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {n}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
