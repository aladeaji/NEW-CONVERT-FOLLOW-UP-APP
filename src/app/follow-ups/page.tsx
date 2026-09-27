import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { dueLists } from "@/lib/followups";

type Row = {
  id: string;
  fullName: string;
  phone: string;
  nextFollowUpAt: Date | null;
  nextAction: string | null;
  assignedWorker: { id: string; name: string } | null;
};

function Group({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: Row[];
  empty: string;
}) {
  return (
    <section className="mt-4">
      <h2 className="font-bold text-[#1A2B4A]">
        {title} ({rows.length})
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        {rows.map((p) => (
          <li key={p.id}>
            <Link
              href={`/people/${p.id}`}
              className="block rounded-[10px] bg-white p-4"
            >
              <p className="font-bold">{p.fullName}</p>
              <p className="text-sm text-slate-500">
                {p.nextAction ?? "No next action"}
                {p.nextFollowUpAt
                  ? ` · ${new Date(p.nextFollowUpAt).toLocaleDateString()}`
                  : ""}
              </p>
              {p.assignedWorker && (
                <p className="text-sm text-slate-500">
                  with {p.assignedWorker.name}
                </p>
              )}
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-[10px] bg-white p-4 text-sm text-slate-500">
            {empty}
          </li>
        )}
      </ul>
    </section>
  );
}

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ worker?: string }>;
}) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const sp = await searchParams;
  const churchWide = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"].includes(me.role);
  const scope = {
    churchId: me.churchId,
    workerId: churchWide ? sp.worker || undefined : me.id,
  };
  const { overdue, dueToday, upcoming, awaiting } = await dueLists(scope);
  const workers = churchWide
    ? await db.user.findMany({
        where: { churchId: me.churchId, active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">Follow-ups</h1>
      {churchWide && (
        <form method="get" className="mt-3">
          <select
            name="worker"
            defaultValue={sp.worker ?? ""}
            className="min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]"
          >
            <option value="">Everyone</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button className="ml-2 min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 font-semibold text-[#1A2B4A]">
            Filter
          </button>
        </form>
      )}
      <Group title="Overdue" rows={overdue} empty="Nothing overdue." />
      <Group title="Due today" rows={dueToday} empty="Nothing due today." />
      <Group
        title="Awaiting first contact"
        rows={awaiting}
        empty="No one waiting for first contact."
      />
      <Group title="Upcoming" rows={upcoming} empty="Nothing scheduled." />
    </main>
  );
}
