"use client";
import React from "react";

interface DaysCounterProps {
  tripStartDate?: number;
}

export function DaysCounter({ tripStartDate }: DaysCounterProps) {
  if (!tripStartDate) {
    return (
      <div className="p-3 bg-brand-50/70 border border-brand-100 rounded-xl text-center">
        <p className="text-xs text-brand-800 font-medium">
          🌟 Safe Travels! You can track your trip duration and day progress here.
        </p>
      </div>
    );
  }

  const daysSince = Math.floor((Date.now() - tripStartDate) / 86_400_000);
  const label =
    daysSince === 0
      ? "Trip starts today! 🎉"
      : `Day ${daysSince + 1} of your journey 🌍`;

  return (
    <div className="text-center py-3.5 px-4 bg-gradient-to-r from-brand-50 to-green-50 rounded-2xl border border-brand-100 shadow-sm">
      <div className="text-3xl font-black text-brand-700 leading-none">
        {daysSince + 1}
      </div>
      <p className="text-xs font-bold text-brand-800 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
