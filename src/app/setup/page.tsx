import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

async function createChurch(formData: FormData) {
  "use server";
  const session = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const church = await db.church.create({ data: { name } });
  await db.user.update({
    where: { id: session.user.id },
    data: { churchId: church.id, role: "CHURCH_ADMIN" },
  });
  redirect("/today");
}

export default async function SetupPage() {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (me?.churchId) redirect("/today");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">
        Name your church
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Step 2 of onboarding: create the church profile. You become the Church
        Administrator.
      </p>
      <form action={createChurch} className="mt-6 flex flex-col gap-3">
        <input
          name="name"
          required
          placeholder="e.g. Grace Community Church"
          className="min-h-[44px] rounded-[10px] border border-slate-200 px-4 text-[15px]"
        />
        <button
          type="submit"
          className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] font-semibold text-white"
        >
          Create church
        </button>
      </form>
    </main>
  );
}
