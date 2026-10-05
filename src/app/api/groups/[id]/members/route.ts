import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { addMember, removeMember } from "@/lib/groups";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_MANAGE.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { id } = await params;
  const { personId } = (await req.json()) as { personId?: string };
  if (!personId)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  try {
    await addMember(me.churchId, id, personId, me.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_MANAGE.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get("personId");
  if (!personId)
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  await removeMember(me.churchId, id, personId);
  return NextResponse.json({ ok: true });
}
