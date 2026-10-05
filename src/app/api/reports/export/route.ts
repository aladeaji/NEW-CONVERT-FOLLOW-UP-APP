import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const LEADERSHIP = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR", "PASTOR"];

function csv(rows: (string | number | null)[][], header: string[]) {
  const esc = (v: string | number | null) =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [header.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId || !LEADERSHIP.includes(me.role))
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const type = new URL(req.url).searchParams.get("type");
  let body = "";
  let name = "export";

  if (type === "people") {
    const people = await db.person.findMany({
      where: { churchId: me.churchId },
      include: { assignedWorker: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: 2000,
    });
    body = csv(
      people.map((p) => [
        p.fullName,
        p.phone,
        p.personType,
        p.journeyStage,
        p.assignedWorker?.name ?? "",
        p.nextAction ?? "",
        p.nextFollowUpAt ? new Date(p.nextFollowUpAt).toISOString().slice(0, 10) : "",
      ]),
      ["Name", "Phone", "Type", "Stage", "Worker", "Next action", "Next date"],
    );
    name = "people";
  } else if (type === "followups") {
    const items = await db.followUp.findMany({
      where: { person: { churchId: me.churchId } },
      include: {
        person: { select: { fullName: true } },
        worker: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 2000,
    });
    body = csv(
      items.map((f) => [
        f.person.fullName,
        f.worker.name,
        new Date(f.date).toISOString().slice(0, 10),
        f.type,
        f.outcome ?? "",
        f.nextAction ?? "",
      ]),
      ["Person", "Worker", "Date", "Type", "Outcome", "Next action"],
    );
    name = "followups";
  } else if (type === "attendance") {
    const records = await db.attendanceRecord.findMany({
      where: { service: { churchId: me.churchId } },
      include: {
        service: { select: { name: true, date: true } },
        person: { select: { fullName: true } },
      },
      orderBy: { service: { date: "desc" } },
      take: 5000,
    });
    body = csv(
      records.map((r) => [
        r.service.name,
        new Date(r.service.date).toISOString().slice(0, 10),
        r.person.fullName,
        r.present ? "present" : "absent",
      ]),
      ["Service", "Date", "Person", "Status"],
    );
    name = "attendance";
  } else {
    return NextResponse.json({ error: "Unknown type." }, { status: 400 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
    },
  });
}
