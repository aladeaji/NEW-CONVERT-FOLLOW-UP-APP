import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { listWorkersWithLoad } from "@/lib/workers";
import AddWorkerForm from "./AddWorkerForm";
import WorkerRow from "./WorkerRow";

const CAN_MANAGE = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export default async function WorkersPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");
  if (!CAN_MANAGE.includes(me.role)) redirect("/today");

  const workers = await listWorkersWithLoad(me.churchId);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">
        Workers ({workers.length})
      </h1>
      <div className="mt-4">
        <AddWorkerForm />
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {workers.map((w) => (
          <WorkerRow key={w.id} worker={w} isSelf={w.id === me.id} />
        ))}
      </ul>
    </main>
  );
}
