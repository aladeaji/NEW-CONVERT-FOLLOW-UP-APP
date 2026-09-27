"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PASTORAL_REASONS } from "@/lib/constants";

export default function PastoralCard({
  personId,
  openCase,
  canFlag,
}: {
  personId: string;
  openCase: { reason: string; raiser: { name: string } } | null;
  canFlag: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canFlag) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/pastoral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        reason: String(data.get("reason")),
        detail: String(data.get("detail") ?? ""),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(json?.error ?? "Could not flag.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <section className="rounded-[10px] bg-violet-50 p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-violet-400">
        Pastoral attention
      </h2>
      {openCase ? (
        <p className="mt-2 text-[15px]">
          Flagged by {openCase.raiser.name}: {openCase.reason}
        </p>
      ) : (
        <div className="mt-2">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="min-h-[44px] rounded-[10px] border border-violet-300 bg-white px-4 font-semibold text-violet-800"
            >
              Flag for pastor
            </button>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
              <select
                name="reason"
                className="min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]"
              >
                {PASTORAL_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <input
                name="detail"
                placeholder="Detail (optional)"
                className="min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]"
              />
              {error && (
                <p className="text-sm font-semibold text-red-600">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[44px] flex-1 rounded-[10px] bg-violet-800 font-semibold text-white disabled:opacity-60"
                >
                  {busy ? "Flagging…" : "Flag"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
