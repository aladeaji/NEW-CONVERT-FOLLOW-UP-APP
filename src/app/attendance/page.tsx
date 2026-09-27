import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { listServices, attendanceConcerns } from "@/lib/attendance";
import ServiceForm from "./ServiceForm";
import ConcernCard from "./ConcernCard";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export default async function AttendancePage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const [services, concerns] = await Promise.all([
    listServices(me.churchId),
    attendanceConcerns(me.churchId),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">Attendance</h1>

      {CAN_MANAGE.includes(me.role) && (
        <div className="mt-4">
          <ServiceForm />
        </div>
      )}

      <h2 className="mt-6 font-bold text-[#1A2B4A]">
        Concerns ({concerns.length})
      </h2>
      <p className="text-sm text-slate-500">
        Based on the last 3 Sunday services. Flagging creates a follow-up due
        tomorrow.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {concerns.slice(0, 20).map((c) => (
          <ConcernCard key={c.id} concern={c} />
        ))}
        {concerns.length === 0 && (
          <p className="rounded-[10px] bg-white p-4 text-sm text-slate-500">
            No declining or missing people. Needs at least 3 Sunday services
            recorded.
          </p>
        )}
      </div>

      <h2 className="mt-6 font-bold text-[#1A2B4A]">Services</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {services.map((s) => (
          <li key={s.id}>
            <Link
              href={`/attendance/${s.id}`}
              className="block rounded-[10px] bg-white p-4"
            >
              <p className="font-bold">{s.name}</p>
              <p className="text-sm text-slate-500">
                {new Date(s.date).toLocaleDateString()} · {s.kind} ·{" "}
                {s._count.records} records
              </p>
            </Link>
          </li>
        ))}
        {services.length === 0 && (
          <li className="rounded-[10px] bg-white p-4 text-sm text-slate-500">
            No services yet. Create one above.
          </li>
        )}
      </ul>
    </main>
  );
}
