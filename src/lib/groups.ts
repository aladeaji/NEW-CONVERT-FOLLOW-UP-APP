import { db } from "@/lib/db";

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

export async function listGroups(churchId: string) {
  return db.group.findMany({
    where: { churchId },
    include: { _count: { select: { members: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createGroup(input: {
  churchId: string;
  name: string;
  kind: string;
}) {
  return db.group.create({
    data: { churchId: input.churchId, name: input.name, kind: input.kind as never },
  });
}

export async function groupDetail(churchId: string, groupId: string) {
  return db.group.findFirst({
    where: { id: groupId, churchId },
    include: {
      members: {
        include: { person: { select: { id: true, fullName: true, phone: true } } },
        orderBy: { person: { fullName: "asc" } },
      },
    },
  });
}

export async function addMember(
  churchId: string,
  groupId: string,
  personId: string,
  actorId: string,
) {
  const [group, person] = await Promise.all([
    db.group.findFirst({ where: { id: groupId, churchId } }),
    db.person.findFirst({ where: { id: personId, churchId } }),
  ]);
  if (!group) throw new Error("Group not found.");
  if (!person) throw new Error("Person not found.");

  const existing = await db.membership.findUnique({
    where: { personId_groupId: { personId, groupId } },
  });
  if (existing) throw new Error("Already a member.");

  const connectedIdx = STAGE_ORDER.indexOf("CONNECTED");
  const shouldAdvance =
    (group.kind === "FELLOWSHIP" || group.kind === "CLASS") &&
    STAGE_ORDER.indexOf(person.journeyStage) < connectedIdx;

  await db.$transaction([
    db.membership.create({ data: { personId, groupId } }),
    ...(group.kind === "FELLOWSHIP"
      ? [
          db.person.update({
            where: { id: personId },
            data: { fellowshipId: groupId },
          }),
        ]
      : []),
    ...(shouldAdvance
      ? [
          db.person.update({
            where: { id: personId },
            data: { journeyStage: "CONNECTED" as const },
          }),
        ]
      : []),
    db.activityEvent.create({
      data: {
        personId,
        actorId,
        type: "JOINED_GROUP",
        payload: { groupId, groupName: group.name, kind: group.kind },
      },
    }),
  ]);
}

export async function removeMember(
  churchId: string,
  groupId: string,
  personId: string,
) {
  const group = await db.group.findFirst({ where: { id: groupId, churchId } });
  if (!group) throw new Error("Group not found.");
  await db.$transaction([
    db.membership.deleteMany({ where: { personId, groupId } }),
    ...(group.kind === "FELLOWSHIP"
      ? [
          db.person.updateMany({
            where: { id: personId, fellowshipId: groupId },
            data: { fellowshipId: null },
          }),
        ]
      : []),
  ]);
}
