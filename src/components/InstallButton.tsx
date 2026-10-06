"use client";

import { useEffect, useState } from "react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

function alreadyInstalled() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(alreadyInstalled);
  const [dismissed, setDismissed] = useState(false);
  const ios = useState(isIosDevice)[0];

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || dismissed) return null;

  if (deferred) {
    return (
      <button
        onClick={async () => {
          await deferred.prompt();
          const { outcome } = await deferred.userChoice;
          setDeferred(null);
          if (outcome === "accepted") setDismissed(true);
        }}
        className="min-h-[44px] rounded-[10px] bg-green-700 px-5 py-3 text-sm font-bold text-white"
      >
        ⬇ Install app
      </button>
    );
  }

  if (ios) {
    return (
      <p className="rounded-[10px] bg-white p-4 text-sm text-slate-600">
        To install: tap <b>Share</b> → <b>Add to Home Screen</b>.
      </p>
    );
  }

  return null;
}
