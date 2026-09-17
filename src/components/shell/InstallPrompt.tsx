"use client";
import React, { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mdf_install_dismissed";
const DISMISS_DAYS = 7;

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (
      dismissed &&
      Date.now() - parseInt(dismissed, 10) < DISMISS_DAYS * 86_400_000
    ) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    setVisible(false);
  };

  const dismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="PWA install banner"
      className="fixed top-16 inset-x-4 max-w-md mx-auto z-50 bg-brand-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-brand-600"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">📲</span>
        <div className="text-xs">
          <p className="font-bold">Add Mom&apos;s Dragonfly</p>
          <p className="text-brand-100">Install to your home screen for quick offline access</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={install}
          className="px-3 py-1.5 bg-white hover:bg-brand-50 text-brand-800 rounded-lg text-xs font-bold shadow-sm"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="text-brand-200 hover:text-white p-1 text-sm font-bold"
          aria-label="Dismiss install banner"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
