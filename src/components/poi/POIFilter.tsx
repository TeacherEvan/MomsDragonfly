"use client";
import React from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

const CATEGORIES: ReadonlyArray<{ value: string; label: string; icon: IconName }> = [
  { value: "all", label: "All", icon: "sparkle" },
  { value: "restaurant", label: "Food", icon: "restaurant" },
  { value: "toilets", label: "Restrooms", icon: "toilet" },
  { value: "pharmacy", label: "Pharmacy", icon: "pharmacy" },
  { value: "attraction", label: "Attractions", icon: "landmark" },
  { value: "entertainment", label: "Events", icon: "theater" },
  { value: "park", label: "Parks", icon: "tree" },
];

interface POIFilterProps {
  category: string;
  onChange: (cat: string) => void;
}

export function POIFilter({ category, onChange }: POIFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-none" role="tablist" aria-label="Place categories">
      {CATEGORIES.map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={category === value}
          onClick={() => onChange(value)}
          className={cn(
            "shrink-0 px-3.5 py-1.5 rounded-full text-caption font-semibold border transition-all duration-fast",
            "min-h-[var(--touch-target)] inline-flex items-center gap-1.5",
            category === value
              ? "bg-primary-500 text-dragonfly-navy-950 border-primary-500 shadow-glow"
              : "bg-surface-900/80 backdrop-blur-sm text-dragonfly-navy-300 border-dragonfly-navy-700 hover:border-dragonfly-navy-600 hover:bg-dragonfly-navy-800 active:scale-[0.98]"
          )}
        >
          <Icon name={icon} size={15} strokeWidth={category === value ? 2.1 : 1.75} />
          {label}
        </button>
      ))}
    </div>
  );
}
