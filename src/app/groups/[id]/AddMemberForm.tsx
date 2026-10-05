"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMemberForm({
  groupId,
  candidates,
}: {
  groupId: string;
  candidates: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: String(data.get("personId")) }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(json?.error ?? "Could not add member.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <select
        name="personId"
        required
        defaultValue=""
        className="min-h-[44px] flex-1 rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]"
      >
        <option value="" disabled>
          Select person…
        </option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.fullName}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] px-4 font-semibold text-white disabled:opacity-60"
      >
        {busy ? "…" : "Add"}
      </button>
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
    </form>
  );
}

export function RemoveButton({
  groupId,
  personId,
}: {
  groupId: string;
  personId: string;
}) {
  const router = useRouter();
  async function remove() {
    await fetch(`/api/groups/${groupId}/members?personId=${personId}`, {
      method: "DELETE",
    });
    router.refresh();
  }
  return (
    <button
      onClick={remove}
      className="text-sm font-semibold text-red-600"
    >
      Remove
    </button>
  );
}
