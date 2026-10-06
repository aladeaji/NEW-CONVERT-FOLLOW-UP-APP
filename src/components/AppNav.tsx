"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/today", label: "Today" },
  { href: "/people", label: "People" },
  { href: "/follow-ups", label: "Follow-ups" },
  { href: "/attendance", label: "Attendance" },
  { href: "/menu", label: "Menu" },
];

export default function AppNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => setVisible(r.ok))
      .catch(() => setVisible(false));
  }, [pathname]);

  if (!visible) return null;
  if (pathname === "/sign-in" || pathname === "/sign-up") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-2xl grid-cols-5">
        {TABS.map((t) => {
          const active =
            pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`min-h-[56px] py-3 text-center text-[13px] font-bold ${
                active ? "text-[#1A2B4A]" : "text-slate-400"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
