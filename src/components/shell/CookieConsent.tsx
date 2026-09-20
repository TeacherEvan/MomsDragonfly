"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

const KEY = "mdf_cookie_ok";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and storage notice"
      className="fixed bottom-16 inset-x-0 z-40"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="bg-surface-900/95 backdrop-blur-sm text-neutral-50 rounded-xl p-4 shadow-strong border border-neutral-800">
          <p className="text-sm mb-3 text-neutral-300">
            Mom&apos;s Dragonfly stores your travel preferences and cache locally on your device.
            No personal information is tracked or shared.
          </p>
          <button
            onClick={accept}
            className={cn(
              "w-full bg-primary-500 hover:bg-primary-400 text-neutral-950 rounded-lg py-2 font-semibold text-sm transition-colors duration-fast",
              "min-h-[var(--touch-target)]"
            )}
          >
            I understand
          </button>
        </div>
      </div>
    </aside>
  );
}
