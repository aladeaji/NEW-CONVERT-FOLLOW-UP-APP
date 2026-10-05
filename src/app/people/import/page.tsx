import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import ImportForm from "./ImportForm";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export default async function ImportPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");
  if (!CAN_MANAGE.includes(me.role)) redirect("/people");

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <Link href="/people" className="text-sm font-semibold text-[#1A2B4A]">
        ← People
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A]">
        Import records
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        CSV with header row. Required: name, phone, visit date. Optional:
        type, age, gender, area, how they came, notes. Existing phone numbers
        are skipped. Max 500 rows, 1MB.
      </p>
      <div className="mt-4">
        <ImportForm />
      </div>
    </main>
  );
}
