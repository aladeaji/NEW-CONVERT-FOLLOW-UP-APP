"use client";

import { useState } from "react";

export default function ImportForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: { line: number; reason: string }[];
  } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/people/import", {
      method: "POST",
      body: new FormData(e.currentTarget),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(json?.error ?? "Import failed.");
      return;
    }
    setResult(await res.json());
  }

  return (
    <div className="rounded-[10px] bg-white p-5">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="min-h-[44px] text-[15px]"
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Importing…" : "Import CSV"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      {result && (
        <div className="mt-3 text-sm">
          <p className="font-bold text-green-700">
            Imported {result.created} people.
          </p>
          {result.skipped.map((s) => (
            <p key={s.line} className="text-slate-500">
              Line {s.line}: {s.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
