import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import InstallButton from "@/components/InstallButton";

const LEADERSHIP = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR", "PASTOR"];
const MANAGERS = ["SUPER_ADMIN", "CHURCH_ADMIN", "COORDINATOR"];

export default async function MenuPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const items: [string, string][] = [
    ["Unassigned people", "/unassigned"],
    ["Alerts", "/alerts"],
    ["Groups", "/groups"],
  ];
  if (LEADERSHIP.includes(me.role)) {
    items.push(["Pastoral attention", "/pastoral"]);
    items.push(["Reports", "/reports"]);
    items.push(["Church dashboard", "/admin"]);
  }
  if (MANAGERS.includes(me.role)) {
    items.push(["Workers", "/workers"]);
    items.push(["Register person", "/people/new"]);
  } else {
    items.push(["Register person", "/people/new"]);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">Menu</h1>
      <div className="mt-3">
        <InstallButton />
      </div>
      <div className="mt-4 flex flex-col gap-2 pb-20">
        {items.map(([label, href]) => (
          <Link
            key={href + label}
            href={href}
            className="rounded-[10px] bg-white p-4 font-semibold text-[#1A2B4A]"
          >
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
