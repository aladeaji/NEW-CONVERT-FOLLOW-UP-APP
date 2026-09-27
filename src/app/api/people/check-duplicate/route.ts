import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { findDuplicates } from "@/lib/people";

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) return NextResponse.json({ matches: [] });
  const { phone, fullName } = (await req.json()) as {
    phone?: string;
    fullName?: string;
  };
  if (!phone && !fullName) return NextResponse.json({ matches: [] });
  const matches = await findDuplicates(
    me.churchId,
    phone ?? "",
    fullName ?? "",
  );
  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      phone: m.phone,
      personType: m.personType,
      worker: m.assignedWorker?.name ?? null,
    })),
  });
}
