import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { assignPerson, recommendWorkers } from "@/lib/assignment";

const CAN_ASSIGN = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_ASSIGN.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { personId, workerId } = (await req.json()) as {
    personId?: string;
    workerId?: string;
  };
  if (!personId || !workerId)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  try {
    const result = await assignPerson(me.churchId, personId, workerId, me.id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Assign failed." },
      { status: 400 },
    );
  }
}

export async function GET() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) return NextResponse.json({ suggestions: [] });
  if (!CAN_ASSIGN.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  const suggestions = await recommendWorkers(me.churchId);
  return NextResponse.json({ suggestions });
}
