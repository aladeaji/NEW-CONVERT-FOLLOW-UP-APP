import { db } from "@/lib/db";
import { PASTORAL_REASONS } from "./constants";

export async function raiseCase(input: {
  churchId: string;
  personId: string;
  raisedBy: string;
  reason: string;
  detail?: string | null;
}) {
  if (!PASTORAL_REASONS.includes(input.reason as never)) throw new Error("Invalid reason.");
  const person = await db.person.findFirst({
    where: { id: input.personId, churchId: input.churchId },
  });
  if (!person) throw new Error("Person not found.");

  const existing = await db.pastoralCase.findFirst({
    where: { personId: input.personId, status: { in: ["OPEN", "IN_PROGRESS"] } },
  });
  if (existing) throw new Error("An open pastoral case already exists.");

  const [c] = await db.$transaction([
    db.pastoralCase.create({
      data: {
        personId: input.personId,
        raisedBy: input.raisedBy,
        reason: input.detail ? `${input.reason} — ${input.detail}` : input.reason,
      },
    }),
    db.activityEvent.create({
      data: {
        personId: input.personId,
        actorId: input.raisedBy,
        type: "PASTORAL_FLAGGED",
        payload: { reason: input.reason },
      },
    }),
  ]);
  return c;
}

export async function listCases(churchId: string, status?: string) {
  const people = await db.person.findMany({
    where: { churchId },
    select: { id: true },
  });
  const ids = people.map((p) => p.id);
  return db.pastoralCase.findMany({
    where: {
      personId: { in: ids },
      ...(status ? { status: status as never } : {}),
    },
    include: {
      person: { select: { id: true, fullName: true, phone: true } },
      raiser: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function resolveCase(
  churchId: string,
  caseId: string,
  actorId: string,
  resolution: string,
) {
  const c = await db.pastoralCase.findUnique({
    where: { id: caseId },
    include: { person: { select: { churchId: true } } },
  });
  if (!c || c.person.churchId !== churchId) throw new Error("Case not found.");
  await db.$transaction([
    db.pastoralCase.update({
      where: { id: caseId },
      data: { status: "RESOLVED", resolution },
    }),
    db.activityEvent.create({
      data: {
        personId: c.personId,
        actorId,
        type: "PASTORAL_RESOLVED",
        payload: { resolution },
      },
    }),
  ]);
}

export async function openCaseForPerson(personId: string) {
  return db.pastoralCase.findFirst({
    where: { personId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: { raiser: { select: { name: true } } },
  });
}
