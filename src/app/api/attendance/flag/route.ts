import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { flagConcernForFollowUp } from "@/lib/attendance";

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });

  const { personId, signal } = (await req.json()) as {
    personId?: string;
    signal?: "MISSING" | "DECLINING";
  };
  if (!personId || (signal !== "MISSING" && signal !== "DECLINING"))
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const person = await db.person.findFirst({
    where: { id: personId, churchId: me.churchId },
  });
  if (!person)
    return NextResponse.json({ error: "Person not found." }, { status: 404 });

  const allowed =
    ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"].includes(me.role) ||
    person.assignedWorkerId === me.id;
  if (!allowed)
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  await flagConcernForFollowUp(me.churchId, personId, me.id, signal);
  return NextResponse.json({ ok: true });
}
