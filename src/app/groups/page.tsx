import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { listGroups } from "@/lib/groups";
import GroupForm from "./GroupForm";

export default async function GroupsPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const groups = await listGroups(me.churchId);
  const canManage = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"].includes(me.role);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">Groups</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fellowships, classes, and departments — joining one is the integration
        signal.
      </p>
      {canManage && (
        <div className="mt-4">
          <GroupForm />
        </div>
      )}
      <ul className="mt-4 flex flex-col gap-2">
        {groups.map((g) => (
          <li key={g.id}>
            <Link
              href={`/groups/${g.id}`}
              className="flex items-center justify-between rounded-[10px] bg-white p-4"
            >
              <span className="font-bold">{g.name}</span>
              <span className="text-sm text-slate-500">
                {g.kind} · {g._count.members} members
              </span>
            </Link>
          </li>
        ))}
        {groups.length === 0 && (
          <li className="rounded-[10px] bg-white p-6 text-center text-sm text-slate-500">
            No groups yet.
          </li>
        )}
      </ul>
    </main>
  );
}
