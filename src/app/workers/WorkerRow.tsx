"use client";

import { useRouter } from "next/navigation";

export type WorkerRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  assigned: number;
  overdue: number;
  dueToday: number;
  awaiting: number;
};

export default function WorkerRow({
  worker,
  isSelf,
}: {
  worker: WorkerRow;
  isSelf: boolean;
}) {
  const router = useRouter();

  async function patch(body: object) {
    const res = await fetch(`/api/workers/${worker.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      alert(json?.error ?? "Update failed.");
      return;
    }
    router.refresh();
  }

  return (
    <li
      className={`rounded-[10px] bg-white p-4 ${worker.active ? "" : "opacity-60"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold">
            {worker.name} {isSelf && <span className="text-slate-400">(you)</span>}
          </p>
          <p className="text-sm text-slate-500">{worker.email}</p>
        </div>
        <select
          value={worker.role}
          disabled={isSelf}
          onChange={(e) => patch({ role: e.target.value })}
          className="min-h-[44px] rounded-[10px] border border-slate-200 bg-white px-2 text-sm"
          aria-label="Role"
        >
          {["WORKER", "COORDINATOR", "PASTOR", "CHURCH_ADMIN"].map((r) => (
            <option key={r} value={r}>
              {r.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {worker.assigned} assigned · {worker.overdue} overdue ·{" "}
        {worker.dueToday} due today · {worker.awaiting} awaiting contact
      </p>
      {!isSelf && (
        <button
          onClick={() => patch({ active: !worker.active })}
          className="mt-2 min-h-[44px] rounded-[10px] border border-slate-200 px-4 text-sm font-semibold text-[#1A2B4A]"
        >
          {worker.active ? "Deactivate" : "Reactivate"}
        </button>
      )}
    </li>
  );
}
