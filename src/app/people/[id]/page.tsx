import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getPerson } from "@/lib/people";

const STAGES = [
  "REGISTERED",
  "ASSIGNED",
  "FIRST_CONTACT",
  "ENGAGING",
  "ATTENDING",
  "GROWING",
  "CONNECTED",
  "INTEGRATED",
  "ACTIVE_MEMBER",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] bg-white p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">{title}</h2>
      <div className="mt-2 text-[15px]">{children}</div>
    </section>
  );
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const me = await db.user.findUnique({ where: { id: session.user.id } });
  if (!me?.churchId) redirect("/setup");

  const { id } = await params;
  const person = await getPerson(me.churchId, id);
  if (!person) notFound();

  const stageIdx = STAGES.indexOf(person.journeyStage);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-6 py-10">
      <Link href="/people" className="text-sm font-semibold text-[#1A2B4A]">← People</Link>
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">{person.fullName}</h1>
      <div className="flex flex-wrap gap-1">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-2 py-1 text-[11px] font-bold ${
              i < stageIdx
                ? "bg-[#1A2B4A] text-white"
                : i === stageIdx
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            {s.replace(/_/g, " ")}
          </span>
        ))}
      </div>

      <Section title="Personal">
        <p>{person.phone}</p>
        <p className="text-sm text-slate-500">
          {[person.personType.replace(/_/g, " "), person.ageGroup, person.gender, person.area]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <p className="text-sm text-slate-500">
          Visit: {new Date(person.visitDate).toLocaleDateString()}
          {person.howCame ? ` · Came via ${person.howCame}` : ""}
        </p>
      </Section>

      <Section title="Follow-up">
        <p>
          Worker: {person.assignedWorker?.name ?? "Unassigned"}
        </p>
        <p className="text-sm text-slate-500">
          Next: {person.nextAction ?? "—"}
          {person.nextFollowUpAt
            ? ` · ${new Date(person.nextFollowUpAt).toLocaleDateString()}`
            : ""}
        </p>
      </Section>

      <Section title="Care">
        <p className="text-sm">{person.notes ?? "No notes yet."}</p>
      </Section>

      <Section title="Timeline">
        {person.events.length === 0 && (
          <p className="text-sm text-slate-500">No history yet.</p>
        )}
        <ol className="flex flex-col gap-3 border-l-2 border-slate-200 pl-4">
          {person.events.map((e) => (
            <li key={e.id}>
              <p className="font-semibold">{e.type.replace(/_/g, " ")}</p>
              <p className="text-sm text-slate-500">
                {new Date(e.at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ol>
      </Section>
    </main>
  );
}
