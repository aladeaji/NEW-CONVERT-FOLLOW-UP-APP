import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createGroup } from "@/lib/groups";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];
const KINDS = ["FELLOWSHIP", "CLASS", "DEPARTMENT"] as const;

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_MANAGE.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { name, kind } = (await req.json()) as { name?: string; kind?: string };
  if (!name?.trim() || !kind || !KINDS.includes(kind as never))
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const group = await createGroup({
    churchId: me.churchId,
    name: name.trim(),
    kind,
  });
  return NextResponse.json({ id: group.id });
}
