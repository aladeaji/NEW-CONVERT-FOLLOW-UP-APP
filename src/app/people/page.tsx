import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { listPeople } from "@/lib/people";

const inputCls =
  "min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; stage?: string; worker?: string }>;
}) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const sp = await searchParams;
  const people = await listPeople({
    churchId: me.churchId,
    q: sp.q,
    personType: sp.type,
    journeyStage: sp.stage,
    workerId: sp.worker,
  });
  const workers = await db.user.findMany({
    where: { churchId: me.churchId, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1A2B4A]">People</h1>
        <div className="flex gap-2">
          <Link
            href="/unassigned"
            className="rounded-[10px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#1A2B4A]"
          >
            Unassigned
          </Link>
          <Link
            href="/people/new"
            className="rounded-[10px] bg-[#1A2B4A] px-4 py-3 text-sm font-semibold text-white"
          >
            + Register
          </Link>
        </div>
      </div>

      <form method="get" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input name="q" placeholder="Name or phone" defaultValue={sp.q} className={inputCls} />
        <select name="type" defaultValue={sp.type ?? ""} className={inputCls}>
          <option value="">All types</option>
          <option value="NEW_CONVERT">New Convert</option>
          <option value="FIRST_TIME_VISITOR">First-Time</option>
          <option value="RETURNING_VISITOR">Returning</option>
          <option value="EXISTING_MEMBER">Member</option>
        </select>
        <select name="stage" defaultValue={sp.stage ?? ""} className={inputCls}>
          <option value="">All stages</option>
          {["REGISTERED","ASSIGNED","FIRST_CONTACT","ENGAGING","ATTENDING","GROWING","CONNECTED","INTEGRATED","ACTIVE_MEMBER"].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <select name="worker" defaultValue={sp.worker ?? ""} className={inputCls}>
          <option value="">All workers</option>
          <option value="unassigned">Unassigned</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
        <button className="col-span-2 min-h-[44px] rounded-[10px] border border-slate-200 bg-white font-semibold text-[#1A2B4A] sm:col-span-4">
          Search & filter
        </button>
      </form>

      <ul className="mt-4 flex flex-col gap-2">
        {people.map((p) => (
          <li key={p.id}>
            <Link
              href={`/people/${p.id}`}
              className="block rounded-[10px] bg-white p-4"
            >
              <p className="font-bold">{p.fullName}</p>
              <p className="text-sm text-slate-500">
                {p.phone} · {p.personType.replace(/_/g, " ")} ·{" "}
                {p.journeyStage.replace(/_/g, " ")}
              </p>
              <p className="text-sm text-slate-500">
                {p.assignedWorker ? `with ${p.assignedWorker.name}` : "Unassigned"}
              </p>
            </Link>
          </li>
        ))}
        {people.length === 0 && (
          <li className="rounded-[10px] bg-white p-6 text-center text-sm text-slate-500">
            No people found. Register the first person.
          </li>
        )}
      </ul>
    </main>
  );
}
