"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

const KEY = "mdf_elderly_mode";

export function ElderlyModeToggle() {
  const [elderly, setElderly] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KEY) === "true";
    setElderly(stored);
    document.documentElement.classList.toggle("elderly", stored);
  }, []);

  const toggle = () => {
    const next = !elderly;
    setElderly(next);
    localStorage.setItem(KEY, String(next));
    document.documentElement.classList.toggle("elderly", next);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium border transition-colors shadow-sm",
        "min-h-[var(--touch-target)] min-w-[var(--touch-target)]",
        elderly
          ? "bg-brand-600 text-white border-brand-600"
          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
      )}
      aria-pressed={elderly}
      aria-label="Toggle large-text mode"
    >
      {elderly ? "🔍 Large Mode: ON" : "🔍 Large Mode"}
    </button>
  );
}
