import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({}, { status: 401 });
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, churchId: true, name: true },
  });
  return NextResponse.json({ role: me?.role ?? null, hasChurch: !!me?.churchId });
}
