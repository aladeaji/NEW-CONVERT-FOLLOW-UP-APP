"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name")),
        kind: String(data.get("kind")),
      }),
    });
    setBusy(false);
    if (res.ok) {
      const json = (await res.json()) as { id: string };
      router.push(`/groups/${json.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        name="name"
        required
        placeholder="e.g. Youth Fellowship"
        className="min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]"
      />
      <select
        name="kind"
        defaultValue="FELLOWSHIP"
        className="min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]"
      >
        <option value="FELLOWSHIP">Fellowship</option>
        <option value="CLASS">Class</option>
        <option value="DEPARTMENT">Department</option>
      </select>
      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] px-4 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "+ Group"}
      </button>
    </form>
  );
}
