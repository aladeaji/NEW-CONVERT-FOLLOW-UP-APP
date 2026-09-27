"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]";

export default function ServiceForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/attendance/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name")),
        date: String(data.get("date")),
        kind: String(data.get("kind")),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not create service.");
      return;
    }
    const json = (await res.json()) as { id: string };
    router.push(`/attendance/${json.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input name="name" required placeholder="e.g. Sunday Service" className={inputCls} />
      <input name="date" type="date" required className={inputCls} />
      <select name="kind" defaultValue="SUNDAY" className={inputCls}>
        {["SUNDAY","MIDWEEK","SPECIAL","FELLOWSHIP","CLASS","OTHER"].map((k) => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] px-4 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "+ Service"}
      </button>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </form>
  );
}
