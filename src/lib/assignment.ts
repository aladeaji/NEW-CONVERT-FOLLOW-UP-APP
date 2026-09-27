import { db } from "@/lib/db";

export async function recommendWorkers(churchId: string, limit = 3) {
  const workers = await db.user.findMany({
    where: { churchId, active: true, role: { in: ["WORKER", "COORDINATOR"] } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const withLoad = await Promise.all(
    workers.map(async (w) => ({
      ...w,
      load: await db.person.count({
        where: { churchId, assignedWorkerId: w.id },
      }),
    })),
  );
  withLoad.sort((a, b) => a.load - b.load || a.name.localeCompare(b.name));
  return withLoad.slice(0, limit);
}

export async function unassignedList(churchId: string) {
  return db.person.findMany({
    where: { churchId, assignedWorkerId: null },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function assignPerson(
  churchId: string,
  personId: string,
  workerId: string,
  actorId: string,
) {
  const [person, worker] = await Promise.all([
    db.person.findFirst({ where: { id: personId, churchId } }),
    db.user.findFirst({
      where: { id: workerId, churchId, active: true },
    }),
  ]);
  if (!person) throw new Error("Person not found.");
  if (!worker) throw new Error("Worker not found in this church.");

  const previousWorkerId = person.assignedWorkerId;
  const isReassign = previousWorkerId && previousWorkerId !== workerId;

  await db.$transaction([
    ...(previousWorkerId
      ? [
          db.assignment.updateMany({
            where: { personId, active: true },
            data: { active: false },
          }),
        ]
      : []),
    db.assignment.create({
      data: { personId, workerId, assignedBy: actorId },
    }),
    db.person.update({
      where: { id: personId },
      data: {
        assignedWorkerId: workerId,
        ...(person.journeyStage === "REGISTERED"
          ? { journeyStage: "ASSIGNED" as const }
          : {}),
      },
    }),
    db.activityEvent.create({
      data: {
        personId,
        actorId,
        type: isReassign ? "REASSIGNED" : "ASSIGNED",
        payload: { from: previousWorkerId ?? null, to: workerId },
      },
    }),
  ]);

  return { reassigned: !!isReassign };
}
