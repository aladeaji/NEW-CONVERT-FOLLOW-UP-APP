import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { listWorkersWithLoad, addWorker } from "@/lib/workers";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];
const ROLES = ["WORKER", "COORDINATOR", "PASTOR", "CHURCH_ADMIN"] as const;

export async function GET() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) return NextResponse.json({ workers: [] });
  if (!CAN_MANAGE.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  return NextResponse.json({
    workers: await listWorkersWithLoad(me.churchId),
  });
}

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_MANAGE.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { name, email, role } = (await req.json()) as {
    name?: string;
    email?: string;
    role?: string;
  };
  if (!name?.trim() || !email?.trim() || !role || !ROLES.includes(role as never))
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  try {
    const { tempPassword } = await addWorker({
      churchId: me.churchId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
    });
    return NextResponse.json({ tempPassword });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed." },
      { status: 400 },
    );
  }
}
