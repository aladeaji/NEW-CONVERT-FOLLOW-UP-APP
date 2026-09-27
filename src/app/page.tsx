const NAV = [
  "Today",
  "People",
  "Follow-ups",
  "Attendance",
  "Workers",
  "Groups",
  "Reports",
  "Alerts",
  "Settings",
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#1A2B4A" }}>
      <header className="px-6 py-10 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest opacity-70">
          Phase 0 — Foundation
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">
          New Convert Follow-up & Attendance
        </h1>
        <p className="mt-2 max-w-xl opacity-85">
          Every person is seen. Every person is assigned. Every person is
          followed up. Every person has a next step.
        </p>
      </header>
      <main className="flex-1 rounded-t-3xl bg-[#f4f6fb] px-6 py-8">
        <nav className="flex flex-wrap gap-2">
          {NAV.map((item, i) => (
            <span
              key={item}
              className={`rounded-lg px-4 py-3 text-sm font-semibold ${
                i === 0 ? "bg-[#1A2B4A] text-white" : "bg-white text-[#1A2B4A]"
              }`}
            >
              {item}
            </span>
          ))}
        </nav>
        <div className="mt-6 grid gap-4 rounded-2xl bg-white p-6">
          <h2 className="text-lg font-bold">App shell is up</h2>
          <p className="text-sm text-slate-500">
            Next.js + TypeScript + Tailwind on this device. Local Postgres,
            BetterAuth, and Cloudflare R2 get wired in the next steps.
          </p>
        </div>
      </main>
    </div>
  );
}
