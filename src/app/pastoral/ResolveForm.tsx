"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch(`/api/pastoral/${caseId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution: String(data.get("resolution")) }),
    });
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] px-4 text-sm font-semibold text-white"
      >
        Record action
      </button>
    );

  return (
    <form onSubmit={onSubmit} className="mt-2 flex gap-2">
      <input
        name="resolution"
        required
        placeholder="Action taken"
        className="min-h-[44px] flex-1 rounded-[10px] border border-slate-200 px-4 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] rounded-[10px] bg-green-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "Resolve"}
      </button>
    </form>
  );
}
