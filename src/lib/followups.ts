import { db } from "@/lib/db";
import { startOfToday } from "./attention";

const DAY = 86400000;

export async function recordFollowUp(input: {
  churchId: string;
  personId: string;
  workerId: string;
  actorId: string;
  type: string;
  outcome?: string | null;
  notes?: string | null;
  concerns?: string | null;
  nextAction?: string | null;
  nextDate?: Date | null;
}) {
  const person = await db.person.findFirst({
    where: { id: input.personId, churchId: input.churchId },
    include: { followUps: { select: { id: true } } },
  });
  if (!person) throw new Error("Person not found.");

  const firstContact =
    person.followUps.length === 0 &&
    (person.journeyStage === "REGISTERED" || person.journeyStage === "ASSIGNED");

  await db.$transaction([
    db.followUp.create({
      data: {
        personId: input.personId,
        workerId: input.workerId,
        type: input.type as never,
        outcome: input.outcome,
        notes: input.notes,
        concerns: input.concerns,
        nextAction: input.nextAction,
        nextDate: input.nextDate,
      },
    }),
    db.person.update({
      where: { id: input.personId },
      data: {
        nextAction: input.nextAction,
        nextFollowUpAt: input.nextDate,
        ...(firstContact ? { journeyStage: "FIRST_CONTACT" as const } : {}),
      },
    }),
    db.activityEvent.create({
      data: {
        personId: input.personId,
        actorId: input.actorId,
        type: "FOLLOW_UP",
        payload: {
          followUpType: input.type,
          outcome: input.outcome ?? null,
        },
      },
    }),
  ]);
}

export interface FollowUpScope {
  churchId: string;
  workerId?: string; // restrict to one worker; omit for church-wide
}

async function scopedPeople(scope: FollowUpScope, extra: object) {
  return db.person.findMany({
    where: {
      churchId: scope.churchId,
      ...(scope.workerId ? { assignedWorkerId: scope.workerId } : {}),
      ...extra,
    },
    include: {
      assignedWorker: { select: { id: true, name: true } },
      followUps: { select: { id: true } },
    },
    orderBy: { nextFollowUpAt: "asc" },
    take: 100,
  });
}

export async function dueLists(scope: FollowUpScope) {
  const today = startOfToday().getTime();
  const [overdue, dueToday, upcoming, awaiting] = await Promise.all([
    scopedPeople(scope, {
      nextFollowUpAt: { lt: new Date(today) },
      assignedWorkerId: { not: null },
    }),
    scopedPeople(scope, {
      nextFollowUpAt: { gte: new Date(today), lt: new Date(today + DAY) },
    }),
    scopedPeople(scope, { nextFollowUpAt: { gte: new Date(today + DAY) } }),
    db.person.findMany({
      where: {
        churchId: scope.churchId,
        ...(scope.workerId ? { assignedWorkerId: scope.workerId } : {}),
        OR: [{ assignedWorkerId: null }, { followUps: { none: {} } }],
      },
      include: {
        assignedWorker: { select: { id: true, name: true } },
        followUps: { select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);
  return { overdue, dueToday, upcoming, awaiting };
}
