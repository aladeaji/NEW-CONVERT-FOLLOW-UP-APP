import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordFollowUp } from "@/lib/followups";

const TYPES = [
  "CALL",
  "WHATSAPP",
  "SMS",
  "PHYSICAL_VISIT",
  "CHURCH_CONVERSATION",
  "HOME_VISIT",
  "INVITATION",
  "PRAYER",
  "OTHER",
] as const;

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });

  const body = (await req.json()) as {
    personId?: string;
    type?: string;
    outcome?: string;
    notes?: string;
    concerns?: string;
    nextAction?: string;
    nextDate?: string;
  };
  if (!body.personId || !body.type || !TYPES.includes(body.type as never))
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const person = await db.person.findFirst({
    where: { id: body.personId, churchId: me.churchId },
  });
  if (!person)
    return NextResponse.json({ error: "Person not found." }, { status: 404 });

  const allowed =
    ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"].includes(me.role) ||
    person.assignedWorkerId === me.id;
  if (!allowed)
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const opt = (v?: string) => {
    const s = (v ?? "").trim();
    return s ? s : null;
  };

  await recordFollowUp({
    churchId: me.churchId,
    personId: person.id,
    workerId: person.assignedWorkerId ?? me.id,
    actorId: me.id,
    type: body.type,
    outcome: opt(body.outcome),
    notes: opt(body.notes),
    concerns: opt(body.concerns),
    nextAction: opt(body.nextAction),
    nextDate: body.nextDate ? new Date(body.nextDate) : null,
  });
  return NextResponse.json({ ok: true });
}
