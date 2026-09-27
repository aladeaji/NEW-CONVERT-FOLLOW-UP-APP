import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import ChecklistForm from "./ChecklistForm";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const { serviceId } = await params;
  const service = await db.attendanceService.findFirst({
    where: { id: serviceId, churchId: me.churchId },
  });
  if (!service) notFound();

  const people = await db.person.findMany({
    where: { churchId: me.churchId },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });
  const records = await db.attendanceRecord.findMany({
    where: { serviceId },
    select: { personId: true, present: true },
  });
  const presentMap = new Map(records.map((r) => [r.personId, r.present]));

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/attendance" className="text-sm font-semibold text-[#1A2B4A]">
        ← Attendance
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A]">
        {service.name}
      </h1>
      <p className="text-sm text-slate-500">
        {new Date(service.date).toLocaleDateString()} · {service.kind}
      </p>
      <div className="mt-4">
        <ChecklistForm
          serviceId={service.id}
          rows={people.map((p) => ({
            ...p,
            present: presentMap.get(p.id) ?? false,
          }))}
        />
      </div>
    </main>
  );
}
