import { db } from "@/lib/db";

export interface PeopleFilter {
  churchId: string;
  q?: string;
  personType?: string;
  journeyStage?: string;
  workerId?: string; // "unassigned" or user id
}

export async function listPeople(f: PeopleFilter) {
  return db.person.findMany({
    where: {
      churchId: f.churchId,
      ...(f.q
        ? {
            OR: [
              { fullName: { contains: f.q, mode: "insensitive" } },
              { phone: { contains: f.q } },
            ],
          }
        : {}),
      ...(f.personType ? { personType: f.personType as never } : {}),
      ...(f.journeyStage ? { journeyStage: f.journeyStage as never } : {}),
      ...(f.workerId === "unassigned"
        ? { assignedWorkerId: null }
        : f.workerId
          ? { assignedWorkerId: f.workerId }
          : {}),
    },
    include: { assignedWorker: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function findDuplicates(churchId: string, phone: string, fullName: string) {
  const normalizedPhone = phone.replace(/[\s-]/g, "");
  return db.person.findMany({
    where: {
      churchId,
      OR: [
        { phone: normalizedPhone },
        { phone: { contains: normalizedPhone } },
        ...(fullName.trim()
          ? [{ fullName: { contains: fullName.trim(), mode: "insensitive" as const } }]
          : []),
      ],
    },
    include: { assignedWorker: { select: { name: true } } },
    take: 5,
  });
}

export async function getPerson(churchId: string, id: string) {
  return db.person.findFirst({
    where: { id, churchId },
    include: {
      assignedWorker: { select: { id: true, name: true } },
      events: { orderBy: { at: "desc" }, take: 50 },
      memberships: { include: { group: { select: { id: true, name: true, kind: true } } } },
      followUps: {
        orderBy: { date: "desc" },
        take: 20,
        include: { worker: { select: { name: true } } },
      },
    },
  });
}
