import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createService } from "@/lib/attendance";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];
const KINDS = ["SUNDAY", "MIDWEEK", "SPECIAL", "FELLOWSHIP", "CLASS", "OTHER"] as const;

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_MANAGE.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { name, date, kind } = (await req.json()) as {
    name?: string;
    date?: string;
    kind?: string;
  };
  if (!name?.trim() || !date || !kind || !KINDS.includes(kind as never))
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  const service = await createService({
    churchId: me.churchId,
    name: name.trim(),
    date: new Date(date),
    kind,
  });
  return NextResponse.json({ id: service.id });
}
