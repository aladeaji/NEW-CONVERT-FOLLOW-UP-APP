"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BulkAssignBar({
  people,
  workers,
}: {
  people: { id: string; fullName: string }[];
  workers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [workerId, setWorkerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function assign() {
    if (!workerId || selected.size === 0) return;
    setBusy(true);
    setResult(null);
    const res = await fetch("/api/assignments/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personIds: [...selected], workerId }),
    });
    setBusy(false);
    if (res.ok) {
      const json = (await res.json()) as { done: number; failed: string[] };
      setResult(
        `Assigned ${json.done}${json.failed.length ? `, ${json.failed.length} failed` : ""}.`,
      );
      setSelected(new Set());
      router.refresh();
    }
  }

  return (
    <div className="rounded-[10px] bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          className="min-h-[44px] flex-1 rounded-[10px] border border-slate-200 px-4 text-[15px]"
        >
          <option value="">Assign selected to…</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <button
          onClick={assign}
          disabled={busy || !workerId || selected.size === 0}
          className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] px-4 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "…" : `Assign (${selected.size})`}
        </button>
      </div>
      {result && <p className="mt-2 text-sm font-semibold text-green-700">{result}</p>}
      <ul className="mt-3 flex flex-col gap-2">
        {people.map((p) => (
          <li key={p.id}>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="h-5 w-5"
              />
              <span className="font-semibold">{p.fullName}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
