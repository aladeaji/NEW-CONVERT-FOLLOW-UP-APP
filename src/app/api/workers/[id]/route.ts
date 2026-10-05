import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { setWorkerActive, setWorkerRole } from "@/lib/workers";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];
const ROLES = ["WORKER", "COORDINATOR", "PASTOR", "CHURCH_ADMIN"] as const;

export async function PATCH(
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
  const { active, role } = (await req.json()) as {
    active?: boolean;
    role?: string;
  };

  try {
    if (typeof active === "boolean") {
      if (id === me.id && !active)
        return NextResponse.json(
          { error: "You cannot deactivate yourself." },
          { status: 400 },
        );
      await setWorkerActive(me.churchId, id, active);
    }
    if (role) {
      if (!ROLES.includes(role as never))
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      await setWorkerRole(me.churchId, id, role, me.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed." },
      { status: 400 },
    );
  }
}
