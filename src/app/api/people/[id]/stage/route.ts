import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const STAGES = [
  "REGISTERED",
  "ASSIGNED",
  "FIRST_CONTACT",
  "ENGAGING",
  "ATTENDING",
  "GROWING",
  "CONNECTED",
  "INTEGRATED",
  "ACTIVE_MEMBER",
] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });

  const { id } = await params;
  const person = await db.person.findFirst({
    where: { id, churchId: me.churchId },
  });
  if (!person)
    return NextResponse.json({ error: "Person not found." }, { status: 404 });

  const allowed =
    ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"].includes(me.role) ||
    person.assignedWorkerId === me.id;
  if (!allowed)
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { stage } = (await req.json()) as { stage?: string };
  if (!stage || !STAGES.includes(stage as never))
    return NextResponse.json({ error: "Invalid stage." }, { status: 400 });

  await db.$transaction([
    db.person.update({ where: { id }, data: { journeyStage: stage as never } }),
    db.activityEvent.create({
      data: {
        personId: id,
        actorId: me.id,
        type: "STAGE_CHANGED",
        payload: { from: person.journeyStage, to: stage },
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
