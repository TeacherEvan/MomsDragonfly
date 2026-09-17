"use client";
import React from "react";
import { cn } from "@/lib/utils/cn";

const CATEGORIES = [
  { value: "all", label: "✨ All" },
  { value: "restaurant", label: "🍽️ Food" },
  { value: "toilets", label: "🚻 Restrooms" },
  { value: "pharmacy", label: "💊 Pharmacy" },
  { value: "attraction", label: "🏛️ Attractions" },
  { value: "entertainment", label: "🎭 Events" },
  { value: "park", label: "🌳 Parks" },
] as const;

interface POIFilterProps {
  category: string;
  onChange: (cat: string) => void;
}

export function POIFilter({ category, onChange }: POIFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-none">
      {CATEGORIES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
            "min-h-[var(--touch-target)] flex items-center justify-center",
            category === value
              ? "bg-brand-600 text-white border-brand-600 shadow-sm"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 active:scale-95"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
