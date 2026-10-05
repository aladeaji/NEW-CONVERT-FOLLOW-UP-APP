import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { groupDetail } from "@/lib/groups";
import AddMemberForm, { RemoveButton } from "./AddMemberForm";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const { id } = await params;
  const group = await groupDetail(me.churchId, id);
  if (!group) notFound();

  const canManage = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"].includes(me.role);
  const memberIds = new Set(group.members.map((m) => m.personId));
  const candidates = canManage
    ? await db.person.findMany({
        where: { churchId: me.churchId },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
        take: 500,
      }).then((all) => all.filter((p) => !memberIds.has(p.id)))
    : [];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link href="/groups" className="text-sm font-semibold text-[#1A2B4A]">
        ← Groups
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold text-[#1A2B4A]">
        {group.name}
      </h1>
      <p className="text-sm text-slate-500">
        {group.kind} · {group.members.length} members
      </p>
      {canManage && (
        <div className="mt-4">
          <AddMemberForm groupId={group.id} candidates={candidates} />
        </div>
      )}
      <ul className="mt-4 flex flex-col gap-2">
        {group.members.map((m) => (
          <li
            key={m.person.id}
            className="flex items-center justify-between rounded-[10px] bg-white p-4"
          >
            <Link
              href={`/people/${m.person.id}`}
              className="font-semibold text-[#1A2B4A] underline"
            >
              {m.person.fullName}
            </Link>
            {canManage && (
              <RemoveButton groupId={group.id} personId={m.person.id} />
            )}
          </li>
        ))}
        {group.members.length === 0 && (
          <li className="rounded-[10px] bg-white p-6 text-center text-sm text-slate-500">
            No members yet.
          </li>
        )}
      </ul>
    </main>
  );
}
