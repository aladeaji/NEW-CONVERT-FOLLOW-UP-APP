"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Match {
  id: string;
  fullName: string;
  phone: string;
  personType: string;
  worker: string | null;
}

const inputCls =
  "min-h-[44px] w-full rounded-[10px] border border-slate-200 px-4 text-[15px]";
const labelCls = "text-sm font-semibold text-slate-600";

export default function NewPersonForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [checked, setChecked] = useState(false);

  async function checkDuplicates(form: HTMLFormElement) {
    const data = new FormData(form);
    const res = await fetch("/api/people/check-duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: String(data.get("phone") ?? ""),
        fullName: String(data.get("fullName") ?? ""),
      }),
    });
    const json = (await res.json()) as { matches: Match[] };
    setMatches(json.matches);
    setChecked(true);
    return json.matches;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = e.currentTarget;

    if (!checked) {
      await checkDuplicates(form);
      setBusy(false);
      return;
    }

    const res = await fetch("/api/people", {
      method: "POST",
      body: new FormData(form),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(json?.error ?? "Could not register this person.");
      setBusy(false);
      return;
    }
    const json = (await res.json()) as { id: string };
    router.push(`/people/${json.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelCls}>Full name *</label>
        <input name="fullName" required placeholder="e.g. John Obi" className={inputCls} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Phone number *</label>
          <input name="phone" required placeholder="e.g. 0803…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Person type *</label>
          <select name="personType" className={inputCls} defaultValue="NEW_CONVERT">
            <option value="NEW_CONVERT">New Convert</option>
            <option value="FIRST_TIME_VISITOR">First-Time Visitor</option>
            <option value="RETURNING_VISITOR">Returning Visitor</option>
            <option value="EXISTING_MEMBER">Existing Member</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Date of visit / conversion *</label>
          <input name="visitDate" type="date" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Age group</label>
          <select name="ageGroup" className={inputCls} defaultValue="">
            <option value="">—</option>
            <option>Under 18</option>
            <option>18–29</option>
            <option>30–49</option>
            <option>50+</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Gender</label>
          <select name="gender" className={inputCls} defaultValue="">
            <option value="">—</option>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Location / area</label>
          <input name="area" placeholder="e.g. Lekki" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>How they came to church</label>
        <input name="howCame" placeholder="e.g. Invited by Sarah" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <textarea name="notes" rows={3} className={inputCls} />
      </div>

      {checked && matches.length > 0 && (
        <div className="rounded-[10px] border border-amber-300 bg-amber-50 p-4">
          <p className="font-bold text-amber-800">Possible existing record</p>
          <p className="text-sm text-amber-700">
            This person may already be registered. Review before creating a
            duplicate.
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/people/${m.id}`}
                  className="text-sm font-semibold text-[#1A2B4A] underline"
                >
                  {m.fullName} · {m.phone}
                  {m.worker ? ` · with ${m.worker}` : " · unassigned"}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-amber-700">
            Press Register again to create a new record anyway.
          </p>
        </div>
      )}

      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Working…" : checked ? "Register" : "Check & register"}
      </button>
    </form>
  );
}
