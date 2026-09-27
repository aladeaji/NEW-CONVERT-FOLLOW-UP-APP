import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { raiseCase, listCases } from "@/lib/pastoral";

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });

  const { personId, reason, detail } = (await req.json()) as {
    personId?: string;
    reason?: string;
    detail?: string;
  };
  if (!personId || !reason)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const person = await db.person.findFirst({
    where: { id: personId, churchId: me.churchId },
  });
  if (!person)
    return NextResponse.json({ error: "Person not found." }, { status: 404 });

  const allowed =
    ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR", "PASTOR"].includes(me.role) ||
    person.assignedWorkerId === me.id;
  if (!allowed)
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  try {
    const c = await raiseCase({
      churchId: me.churchId,
      personId,
      raisedBy: me.id,
      reason,
      detail: detail?.trim() || null,
    });
    return NextResponse.json({ id: c.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed." },
      { status: 400 },
    );
  }
}

export async function GET() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) return NextResponse.json({ cases: [] });
  const cases = await listCases(me.churchId, "OPEN");
  return NextResponse.json({ cases });
}
