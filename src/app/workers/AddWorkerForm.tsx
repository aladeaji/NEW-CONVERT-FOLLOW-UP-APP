"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-4 text-[15px]";

export default function AddWorkerForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setTempPassword(null);
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/workers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name")),
        email: String(data.get("email")),
        role: String(data.get("role")),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(json?.error ?? "Could not add worker.");
      return;
    }
    const json = (await res.json()) as { tempPassword: string };
    setTempPassword(json.tempPassword);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <div className="rounded-[10px] bg-white p-5">
      <h2 className="font-bold text-[#1A2B4A]">Add worker</h2>
      <form onSubmit={onSubmit} className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input name="name" required placeholder="Full name" className={inputCls} />
        <input name="email" type="email" required placeholder="Email" className={inputCls} />
        <select name="role" defaultValue="WORKER" className={inputCls}>
          <option value="WORKER">Worker</option>
          <option value="COORDINATOR">Coordinator</option>
          <option value="PASTOR">Pastor</option>
          <option value="CHURCH_ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] px-4 font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Add"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
      {tempPassword && (
        <p className="mt-2 rounded-[10px] bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          Share this one-time password with the worker: {tempPassword}
        </p>
      )}
    </div>
  );
}
