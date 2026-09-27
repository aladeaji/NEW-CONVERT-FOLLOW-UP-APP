import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const TYPES = [
  "NEW_CONVERT",
  "FIRST_TIME_VISITOR",
  "RETURNING_VISITOR",
  "EXISTING_MEMBER",
] as const;

export async function POST(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId)
    return NextResponse.json({ error: "No church." }, { status: 400 });

  const form = await req.formData();
  const fullName = String(form.get("fullName") ?? "").trim();
  const phone = String(form.get("phone") ?? "").replace(/[\s-]/g, "");
  const personType = String(form.get("personType") ?? "NEW_CONVERT");
  const visitDateRaw = String(form.get("visitDate") ?? "");

  if (!fullName || !phone || !visitDateRaw || !TYPES.includes(personType as never))
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });

  const opt = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s ? s : null;
  };

  try {
    const person = await db.person.create({
      data: {
        churchId: me.churchId,
        fullName,
        phone,
        personType: personType as never,
        visitDate: new Date(visitDateRaw),
        ageGroup: opt(form.get("ageGroup")),
        gender: opt(form.get("gender")),
        area: opt(form.get("area")),
        howCame: opt(form.get("howCame")),
        notes: opt(form.get("notes")),
        events: {
          create: {
            actorId: me.id,
            type: "REGISTERED",
            payload: { personType },
          },
        },
      },
    });
    return NextResponse.json({ id: person.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return NextResponse.json(
        { error: "This phone number is already registered in your church." },
        { status: 409 },
      );
    throw e;
  }
}
