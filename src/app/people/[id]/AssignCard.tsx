"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Worker {
  id: string;
  name: string;
}

interface Suggestion extends Worker {
  load: number;
}

export default function AssignCard({
  personId,
  currentWorkerId,
  workers,
  canAssign,
}: {
  personId: string;
  currentWorkerId: string | null;
  workers: Worker[];
  canAssign: boolean;
}) {
  const router = useRouter();
  const [workerId, setWorkerId] = useState(currentWorkerId ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSuggestions() {
    const res = await fetch("/api/assignments");
    if (!res.ok) return;
    const json = (await res.json()) as { suggestions: Suggestion[] };
    setSuggestions(json.suggestions);
  }

  async function onAssign() {
    if (!workerId) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId, workerId }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(json?.error ?? "Assign failed.");
      return;
    }
    router.refresh();
  }

  if (!canAssign) return null;

  return (
    <section className="rounded-[10px] bg-white p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
        Assignment
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        <select
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          className="min-h-[44px] rounded-[10px] border border-slate-200 px-4 text-[15px]"
        >
          <option value="">Select worker…</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={onAssign}
            disabled={busy || !workerId || workerId === currentWorkerId}
            className="min-h-[44px] flex-1 rounded-[10px] bg-[#1A2B4A] font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : currentWorkerId ? "Reassign" : "Assign"}
          </button>
          <button
            onClick={loadSuggestions}
            className="min-h-[44px] rounded-[10px] border border-slate-200 px-4 font-semibold text-[#1A2B4A]"
          >
            Suggest
          </button>
        </div>
        {suggestions && (
          <ul className="flex flex-col gap-1">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setWorkerId(s.id)}
                  className="text-sm font-semibold text-[#1A2B4A] underline"
                >
                  {s.name} · {s.load} assigned (lowest workload)
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      </div>
    </section>
  );
}
