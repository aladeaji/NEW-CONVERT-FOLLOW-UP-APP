import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { resolveCase } from "@/lib/pastoral";

const LEADERSHIP = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR", "PASTOR"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!LEADERSHIP.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const { id } = await params;
  const { resolution } = (await req.json()) as { resolution?: string };
  if (!resolution?.trim())
    return NextResponse.json({ error: "Resolution required." }, { status: 400 });

  try {
    await resolveCase(me.churchId, id, me.id, resolution.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed." },
      { status: 400 },
    );
  }
}
