import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parsePeopleCsv } from "@/lib/import";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });
  if (!CAN_MANAGE.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file." }, { status: 400 });
  if (file.size > 1024 * 1024)
    return NextResponse.json({ error: "Max 1MB." }, { status: 400 });

  let rows;
  try {
    rows = parsePeopleCsv(await file.text());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad CSV." },
      { status: 400 },
    );
  }

  let created = 0;
  const skipped: { line: number; reason: string }[] = [];
  for (const row of rows) {
    if (row.error) {
      skipped.push({ line: row.line, reason: row.error });
      continue;
    }
    try {
      const person = await db.person.create({
        data: {
          churchId: me.churchId,
          fullName: row.fullName,
          phone: row.phone,
          personType: row.personType as never,
          visitDate: new Date(row.visitDate),
          ageGroup: row.ageGroup,
          gender: row.gender,
          area: row.area,
          howCame: row.howCame,
          notes: row.notes,
        },
      });
      await db.activityEvent.create({
        data: {
          personId: person.id,
          actorId: me.id,
          type: "IMPORTED",
          payload: { via: "csv" },
        },
      });
      created++;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
        skipped.push({ line: row.line, reason: "Phone already registered." });
      else skipped.push({ line: row.line, reason: "Import failed." });
    }
  }
  return NextResponse.json({ created, skipped });
}
