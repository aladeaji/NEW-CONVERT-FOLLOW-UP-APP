"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  "CALL",
  "WHATSAPP",
  "SMS",
  "PHYSICAL_VISIT",
  "CHURCH_CONVERSATION",
  "HOME_VISIT",
  "INVITATION",
  "PRAYER",
  "OTHER",
];

const STAGES = [
  "REGISTERED",
  "ASSIGNED",
  "FIRST_CONTACT",
  "ENGAGING",
  "ATTENDING",
  "GROWING",
  "CONNECTED",
  "INTEGRATED",
  "ACTIVE_MEMBER",
];

const inputCls =
  "min-h-[44px] w-full rounded-[10px] border border-slate-200 px-4 text-[15px]";

export default function FollowUpCard({
  personId,
  phone,
  currentStage,
  canRecord,
}: {
  personId: string;
  phone: string;
  currentStage: string;
  canRecord: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canRecord) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId,
        type: String(data.get("type")),
        outcome: String(data.get("outcome") ?? ""),
        notes: String(data.get("notes") ?? ""),
        concerns: String(data.get("concerns") ?? ""),
        nextAction: String(data.get("nextAction") ?? ""),
        nextDate: String(data.get("nextDate") ?? "") || undefined,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(json?.error ?? "Could not save.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function setStage(stage: string) {
    setBusy(true);
    await fetch(`/api/people/${personId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setBusy(false);
    router.refresh();
  }

  const tel = phone.replace(/[\s-]/g, "");

  return (
    <section className="rounded-[10px] bg-white p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
        Follow-up
      </h2>
      <div className="mt-2 flex gap-2">
        <a
          href={`tel:${tel}`}
          className="min-h-[44px] flex-1 rounded-[10px] bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Call
        </a>
        <a
          href={`https://wa.me/${tel.replace(/^\+/, "")}`}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] flex-1 rounded-[10px] bg-green-700 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          WhatsApp
        </a>
        <a
          href={`sms:${tel}`}
          className="min-h-[44px] flex-1 rounded-[10px] border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-[#1A2B4A]"
        >
          SMS
        </a>
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="min-h-[44px] flex-1 rounded-[10px] bg-[#1A2B4A] font-semibold text-white"
        >
          {open ? "Close" : "Record contact"}
        </button>
        <select
          value={currentStage}
          disabled={busy}
          onChange={(e) => setStage(e.target.value)}
          className="min-h-[44px] rounded-[10px] border border-slate-200 px-2 text-sm"
          aria-label="Journey stage"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
          <select name="type" defaultValue="CALL" className={inputCls}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input name="outcome" placeholder="Outcome" className={inputCls} />
          <textarea name="notes" placeholder="Notes" rows={2} className={inputCls} />
          <input
            name="concerns"
            placeholder="Concerns (optional)"
            className={inputCls}
          />
          <input
            name="nextAction"
            placeholder="Next action, e.g. Call John tomorrow"
            className={inputCls}
          />
          <input name="nextDate" type="date" className={inputCls} />
          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save record"}
          </button>
        </form>
      )}
    </section>
  );
}
