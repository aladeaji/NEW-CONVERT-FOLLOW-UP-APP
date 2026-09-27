import { db } from "@/lib/db";

export type AttendanceSignal = "MISSING" | "DECLINING";

export async function listServices(churchId: string) {
  return db.attendanceService.findMany({
    where: { churchId },
    include: { _count: { select: { records: true } } },
    orderBy: { date: "desc" },
    take: 50,
  });
}

export async function createService(input: {
  churchId: string;
  name: string;
  date: Date;
  kind: string;
}) {
  return db.attendanceService.create({
    data: {
      churchId: input.churchId,
      name: input.name,
      date: input.date,
      kind: input.kind as never,
    },
  });
}

export async function saveRecords(
  churchId: string,
  serviceId: string,
  presentIds: string[],
  recorderId: string,
) {
  const service = await db.attendanceService.findFirst({
    where: { id: serviceId, churchId },
  });
  if (!service) throw new Error("Service not found.");

  const people = await db.person.findMany({
    where: { churchId },
    select: { id: true },
    take: 500,
  });
  const present = new Set(presentIds);

  await db.$transaction(
    people.map((p) =>
      db.attendanceRecord.upsert({
        where: { serviceId_personId: { serviceId, personId: p.id } },
        update: { present: present.has(p.id), recordedBy: recorderId },
        create: {
          serviceId,
          personId: p.id,
          present: present.has(p.id),
          recordedBy: recorderId,
        },
      }),
    ),
  );
}

export async function attendanceHistory(personId: string, take = 10) {
  return db.attendanceRecord.findMany({
    where: { personId },
    include: { service: true },
    orderBy: { service: { date: "desc" } },
    take,
  });
}

export interface Concern {
  id: string;
  fullName: string;
  signal: AttendanceSignal;
  attendedOfLast3: number;
}

export async function attendanceConcerns(churchId: string): Promise<Concern[]> {
  const sundays = await db.attendanceService.findMany({
    where: { churchId, kind: "SUNDAY" },
    orderBy: { date: "desc" },
    take: 4,
    select: { id: true, date: true },
  });
  if (sundays.length < 3) return [];
  const last3 = sundays.slice(0, 3).map((s) => s.id);
  const cutoff = sundays[2].date;

  const people = await db.person.findMany({
    where: { churchId, createdAt: { lt: cutoff } },
    select: { id: true, fullName: true },
    take: 500,
  });
  const records = await db.attendanceRecord.findMany({
    where: { serviceId: { in: last3 }, personId: { in: people.map((p) => p.id) } },
    select: { personId: true, present: true },
  });
  const presentCount = new Map<string, number>();
  for (const r of records) {
    if (r.present) presentCount.set(r.personId, (presentCount.get(r.personId) ?? 0) + 1);
  }
  const out: Concern[] = [];
  for (const p of people) {
    const n = presentCount.get(p.id) ?? 0;
    if (n === 0) out.push({ ...p, signal: "MISSING", attendedOfLast3: 0 });
    else if (n === 1) out.push({ ...p, signal: "DECLINING", attendedOfLast3: 1 });
  }
  return out;
}

export async function flagConcernForFollowUp(
  churchId: string,
  personId: string,
  actorId: string,
  signal: AttendanceSignal,
) {
  const person = await db.person.findFirst({
    where: { id: personId, churchId },
  });
  if (!person) throw new Error("Person not found.");
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  const action =
    signal === "MISSING"
      ? "Check why they have missed recent services."
      : "Follow up on declining attendance.";
  await db.$transaction([
    db.person.update({
      where: { id: personId },
      data: { nextAction: action, nextFollowUpAt: nextDate },
    }),
    db.activityEvent.create({
      data: {
        personId,
        actorId,
        type: "ATTENDANCE_CONCERN",
        payload: { signal },
      },
    }),
  ]);
}
