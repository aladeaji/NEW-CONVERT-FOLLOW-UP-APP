import Link from "next/link";
import InstallButton from "@/components/InstallButton";

const SECTIONS: [string, string, string][] = [
  ["Today", "Who needs your attention?", "/today"],
  ["People", "Register, search, and care for people", "/people"],
  ["Follow-ups", "Due, overdue, and upcoming", "/follow-ups"],
  ["Attendance", "Services and concerns", "/attendance"],
  ["Unassigned", "Everyone needs a worker", "/unassigned"],
  ["Pastoral", "Cases needing leadership", "/pastoral"],
  ["Alerts", "Everything needing action", "/alerts"],
  ["Dashboard", "Church-wide health", "/admin"],
  ["Workers", "Team and workloads", "/workers"],
  ["Groups", "Fellowships and classes", "/groups"],
  ["Reports", "Follow-up and retention", "/reports"],
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#1A2B4A" }}>
      <header className="px-6 py-10 text-white">
        <h1 className="text-3xl font-extrabold">
          New Convert Follow-up & Attendance
        </h1>
        <p className="mt-2 max-w-xl opacity-85">
          Every person is seen. Every person is assigned. Every person is
          followed up. Every person has a next step.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href="/sign-in"
            className="rounded-[10px] bg-white px-5 py-3 text-sm font-bold text-[#1A2B4A]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-[10px] border border-white/40 px-5 py-3 text-sm font-bold text-white"
          >
            Set up your church
          </Link>
          <InstallButton />
        </div>
      </header>
      <main className="flex-1 rounded-t-3xl bg-[#f4f6fb] px-6 py-8">
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SECTIONS.map(([title, desc, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-[10px] bg-white p-4"
            >
              <p className="font-bold text-[#1A2B4A]">{title}</p>
              <p className="text-[13px] text-slate-500">{desc}</p>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
