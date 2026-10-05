import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { auth } from "./auth";
import { dueLists } from "./followups";

export async function listWorkersWithLoad(churchId: string) {
  const workers = await db.user.findMany({
    where: { churchId },
    select: { id: true, name: true, email: true, role: true, active: true },
    orderBy: { name: "asc" },
  });
  return Promise.all(
    workers.map(async (w) => {
      const [assigned, lists] = await Promise.all([
        db.person.count({ where: { churchId, assignedWorkerId: w.id } }),
        dueLists({ churchId, workerId: w.id }),
      ]);
      return {
        ...w,
        assigned,
        overdue: lists.overdue.length,
        dueToday: lists.dueToday.length,
        awaiting: lists.awaiting.length,
      };
    }),
  );
}

export async function addWorker(input: {
  churchId: string;
  name: string;
  email: string;
  role: string;
}) {
  const tempPassword = randomBytes(12).toString("base64url");
  const res = await auth.api.signUpEmail({
    body: { name: input.name, email: input.email, password: tempPassword },
  });
  const user = (res as { user?: { id: string } }).user;
  if (!user) throw new Error("Could not create account.");
  await db.user.update({
    where: { id: user.id },
    data: { churchId: input.churchId, role: input.role as never },
  });
  return { tempPassword };
}

export async function setWorkerActive(
  churchId: string,
  workerId: string,
  active: boolean,
) {
  const w = await db.user.findFirst({ where: { id: workerId, churchId } });
  if (!w) throw new Error("Worker not found.");
  await db.user.update({ where: { id: workerId }, data: { active } });
}

export async function setWorkerRole(
  churchId: string,
  workerId: string,
  role: string,
  adminId: string,
) {
  if (workerId === adminId) throw new Error("You cannot change your own role.");
  const w = await db.user.findFirst({ where: { id: workerId, churchId } });
  if (!w) throw new Error("Worker not found.");
  await db.user.update({
    where: { id: workerId },
    data: { role: role as never },
  });
}
