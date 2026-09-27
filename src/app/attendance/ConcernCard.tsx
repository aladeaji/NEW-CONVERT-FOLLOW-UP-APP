"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Concern } from "@/lib/attendance";

export default function ConcernCard({ concern }: { concern: Concern }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function flag() {
    setBusy(true);
    const res = await fetch("/api/attendance/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: concern.id, signal: concern.signal }),
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-[10px] bg-white p-4">
      <div>
        <p className="font-bold">{concern.fullName}</p>
        <p className="text-sm text-slate-500">
          {concern.signal === "MISSING" ? "Missing" : "Declining"} · attended{" "}
          {concern.attendedOfLast3} of last 3 Sundays
        </p>
      </div>
      {done ? (
        <span className="text-sm font-bold text-green-700">Flagged ✓</span>
      ) : (
        <button
          onClick={flag}
          disabled={busy}
          className="min-h-[44px] rounded-[10px] border border-slate-200 px-4 text-sm font-semibold text-[#1A2B4A] disabled:opacity-50"
        >
          {busy ? "…" : "Flag for follow-up"}
        </button>
      )}
    </div>
  );
}
