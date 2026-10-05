import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { assignPerson } from "@/lib/assignment";

const CAN_ASSIGN = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_ASSIGN.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { personIds, workerId } = (await req.json()) as {
    personIds?: string[];
    workerId?: string;
  };
  if (!Array.isArray(personIds) || personIds.length === 0 || !workerId)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  if (personIds.length > 100)
    return NextResponse.json({ error: "Max 100 at once." }, { status: 400 });

  let done = 0;
  const failed: string[] = [];
  for (const personId of personIds) {
    try {
      await assignPerson(me.churchId, personId, workerId, me.id);
      done++;
    } catch {
      failed.push(personId);
    }
  }
  return NextResponse.json({ done, failed });
}
