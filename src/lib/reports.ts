import { db } from "@/lib/db";
import { dueLists } from "./followups";
import { attendanceConcerns } from "./attendance";

export async function stageFunnel(churchId: string) {
  const grouped = await db.person.groupBy({
    by: ["journeyStage"],
    where: { churchId },
    _count: true,
  });
  return grouped
    .map((g) => ({ stage: g.journeyStage, count: g._count }))
    .sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
    );
}

const STAGE_ORDER = [
  "REGISTERED",
  "ASSIGNED",
  "FIRST_CONTACT",
  "ENGAGING",
  "ATTENDING",
  "GROWING",
  "CONNECTED",
  "INTEGRATED",
  "ACTIVE_MEMBER",
];

export async function followUpSummary(churchId: string) {
  const [total, assigned, contacted, lists, completed] = await Promise.all([
    db.person.count({ where: { churchId } }),
    db.person.count({ where: { churchId, assignedWorkerId: { not: null } } }),
    db.person.count({ where: { churchId, followUps: { some: {} } } }),
    dueLists({ churchId }),
    db.followUp.count({
      where: { person: { churchId } },
    }),
  ]);
  return {
    total,
    assigned,
    coverage: total ? Math.round((assigned / total) * 100) : 0,
    contacted,
    firstContactRate: assigned
      ? Math.round((contacted / assigned) * 100)
      : 0,
    overdue: lists.overdue.length,
    dueToday: lists.dueToday.length,
    awaiting: lists.awaiting.length,
    completed,
  };
}

export async function attendanceSummary(churchId: string) {
  const services = await db.attendanceService.findMany({
    where: { churchId },
    include: { _count: { select: { records: true } } },
    orderBy: { date: "desc" },
    take: 10,
  });
  const withPresent = await Promise.all(
    services.map(async (s) => ({
      ...s,
      present: await db.attendanceRecord.count({
        where: { serviceId: s.id, present: true },
      }),
    })),
  );
  const concerns = await attendanceConcerns(churchId);
  return {
    services: withPresent,
    missing: concerns.filter((c) => c.signal === "MISSING").length,
    declining: concerns.filter((c) => c.signal === "DECLINING").length,
  };
}

export async function retentionSummary(churchId: string) {
  const [total, integrated, inGroup] = await Promise.all([
    db.person.count({ where: { churchId } }),
    db.person.count({
      where: {
        churchId,
        journeyStage: { in: ["INTEGRATED", "ACTIVE_MEMBER"] },
      },
    }),
    db.person.count({
      where: { churchId, memberships: { some: {} } },
    }),
  ]);
  return {
    total,
    integrated,
    integrationRate: total ? Math.round((integrated / total) * 100) : 0,
    connected: inGroup,
  };
}
