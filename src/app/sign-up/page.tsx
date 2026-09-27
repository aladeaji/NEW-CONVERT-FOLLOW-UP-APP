"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await authClient.signUp.email({ name, email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "Sign-up failed.");
      return;
    }
    router.push("/setup");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-extrabold text-[#1A2B4A]">
        Set up your church
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Step 1 of onboarding: create your administrator account.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-[44px] rounded-[10px] border border-slate-200 px-4 text-[15px]"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-h-[44px] rounded-[10px] border border-slate-200 px-4 text-[15px]"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="min-h-[44px] rounded-[10px] border border-slate-200 px-4 text-[15px]"
        />
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] rounded-[10px] bg-[#1A2B4A] font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Creating account…" : "Create account"}
        </button>
        <a href="/sign-in" className="text-center text-sm font-semibold text-[#1A2B4A]">
          Already have an account? Sign in
        </a>
      </form>
    </main>
  );
}
