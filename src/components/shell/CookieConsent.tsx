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
      className="fixed bottom-20 inset-x-4 max-w-md mx-auto bg-gray-900 text-white rounded-xl p-4 z-50 shadow-xl border border-gray-800"
    >
      <p className="text-sm mb-3 text-gray-200">
        Mom&apos;s Dragonfly stores your travel preferences and cache locally on your device.
        No personal information is tracked or shared.
      </p>
      <button
        onClick={accept}
        className={cn(
          "w-full bg-brand-600 hover:bg-brand-500 text-white rounded-lg py-2 font-semibold text-sm transition-colors",
          "min-h-[var(--touch-target)]"
        )}
      >
        I understand
      </button>
    </aside>
  );
}
