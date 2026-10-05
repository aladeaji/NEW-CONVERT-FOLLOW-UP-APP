import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  stageFunnel,
  followUpSummary,
  attendanceSummary,
  retentionSummary,
} from "@/lib/reports";

const LEADERSHIP = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR", "PASTOR"];

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[10px] bg-white p-4">
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="text-[13px] text-slate-500">{label}</p>
    </div>
  );
}

export default async function ReportsPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");
  if (!LEADERSHIP.includes(me.role)) redirect("/today");

  const [funnel, followUps, attendance, retention] = await Promise.all([
    stageFunnel(me.churchId),
    followUpSummary(me.churchId),
    attendanceSummary(me.churchId),
    retentionSummary(me.churchId),
  ]);
  const maxStage = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">Reports</h1>
      <div className="mt-2 flex gap-2 text-sm font-semibold">
        {["people", "followups", "attendance"].map((t) => (
          <Link
            key={t}
            href={`/api/reports/export?type=${t}`}
            className="rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-[#1A2B4A]"
          >
            Export {t} CSV
          </Link>
        ))}
      </div>

      <h2 className="mt-6 font-bold text-[#1A2B4A]">Follow-up</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Total people" value={followUps.total} />
        <Card label="Coverage" value={`${followUps.coverage}%`} />
        <Card label="First contact" value={`${followUps.firstContactRate}%`} />
        <Card label="Completed contacts" value={followUps.completed} />
        <Card label="Overdue" value={followUps.overdue} />
        <Card label="Due today" value={followUps.dueToday} />
        <Card label="Awaiting contact" value={followUps.awaiting} />
      </div>

      <h2 className="mt-6 font-bold text-[#1A2B4A]">Journey funnel</h2>
      <div className="mt-2 flex flex-col gap-1 rounded-[10px] bg-white p-4">
        {funnel.map((f) => (
          <div key={f.stage} className="flex items-center gap-2 text-sm">
            <span className="w-32 shrink-0 font-semibold">
              {f.stage.replace(/_/g, " ")}
            </span>
            <div
              className="h-4 rounded bg-[#1A2B4A]"
              style={{ width: `${Math.max(4, (f.count / maxStage) * 100)}%` }}
            />
            <span className="text-slate-500">{f.count}</span>
          </div>
        ))}
        {funnel.length === 0 && (
          <p className="text-sm text-slate-500">No people yet.</p>
        )}
      </div>

      <h2 className="mt-6 font-bold text-[#1A2B4A]">Attendance</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Missing" value={attendance.missing} />
        <Card label="Declining" value={attendance.declining} />
      </div>
      <ul className="mt-2 flex flex-col gap-2">
        {attendance.services.map((s) => (
          <li key={s.id} className="rounded-[10px] bg-white p-4 text-sm">
            <span className="font-bold">{s.name}</span>{" "}
            <span className="text-slate-500">
              {new Date(s.date).toLocaleDateString()} · {s.present} present
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 font-bold text-[#1A2B4A]">Retention</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Connected to a group" value={retention.connected} />
        <Card label="Integrated" value={retention.integrated} />
        <Card label="Integration rate" value={`${retention.integrationRate}%`} />
      </div>
    </main>
  );
}
