import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { saveRecords } from "@/lib/attendance";

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });

  const { serviceId, presentIds } = (await req.json()) as {
    serviceId?: string;
    presentIds?: string[];
  };
  if (!serviceId || !Array.isArray(presentIds))
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });

  try {
    await saveRecords(me.churchId, serviceId, presentIds, me.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed." },
      { status: 400 },
    );
  }
}
