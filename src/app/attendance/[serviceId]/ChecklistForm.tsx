"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChecklistForm({
  serviceId,
  rows,
}: {
  serviceId: string;
  rows: { id: string; fullName: string; present: boolean }[];
}) {
  const router = useRouter();
  const [present, setPresent] = useState<Set<string>>(
    new Set(rows.filter((r) => r.present).map((r) => r.id)),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    const res = await fetch("/api/attendance/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId, presentIds: [...present] }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {present.size} of {rows.length} present
        </p>
        <button
          onClick={save}
          disabled={busy}
          className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] px-6 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.id}>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[10px] bg-white p-4">
              <input
                type="checkbox"
                checked={present.has(r.id)}
                onChange={() => toggle(r.id)}
                className="h-5 w-5"
              />
              <span className="font-semibold">{r.fullName}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
