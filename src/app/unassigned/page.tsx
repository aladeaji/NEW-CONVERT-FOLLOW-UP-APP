import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { unassignedList } from "@/lib/assignment";
import BulkAssignBar from "./BulkAssignBar";

const CAN_ASSIGN = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

function waitDays(from: Date) {
  return Math.floor((Date.now() - from.getTime()) / 86400000);
}

export default async function UnassignedPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const people = await unassignedList(me.churchId);
  const canAssign = CAN_ASSIGN.includes(me.role);
  const workers = canAssign
    ? await db.user.findMany({
        where: { churchId: me.churchId, active: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/people" className="text-sm font-semibold text-[#1A2B4A]">
        ← People
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A]">
        Unassigned ({people.length})
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        No one here should disappear — assign every person a worker.
      </p>
      {canAssign && people.length > 0 && (
        <div className="mt-4">
          <BulkAssignBar people={people} workers={workers} />
        </div>
      )}
      <ul className="mt-4 flex flex-col gap-2">
        {people.map((p) => {
          const days = waitDays(new Date(p.createdAt));
          const urgent = days >= 7;
          return (
            <li key={p.id}>
              <Link
                href={`/people/${p.id}`}
                className="block rounded-[10px] bg-white p-4"
              >
                <p className="font-bold">{p.fullName}</p>
                <p className="text-sm text-slate-500">
                  Waiting {days} day{days === 1 ? "" : "s"} ·{" "}
                  {p.personType.replace(/_/g, " ")}
                </p>
                {urgent && (
                  <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">
                    URGENT
                  </span>
                )}
              </Link>
            </li>
          );
        })}
        {people.length === 0 && (
          <li className="rounded-[10px] bg-white p-6 text-center text-sm text-slate-500">
            Everyone is assigned. Nothing waiting.
          </li>
        )}
      </ul>
    </main>
  );
}
