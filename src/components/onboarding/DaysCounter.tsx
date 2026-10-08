"use client";
import React from "react";

interface DaysCounterProps {
  tripStartDate?: number;
}

export function DaysCounter({ tripStartDate }: DaysCounterProps) {
  if (!tripStartDate) {
    return (
      <div className="p-3 bg-dragonfly-orange-500/10 border border-dragonfly-orange-500/20 rounded-xl text-center animate-fade-in">
        <p className="text-caption text-dragonfly-orange-300 font-medium">
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
    <div className="text-center py-3.5 px-4 bg-gradient-to-r from-dragonfly-orange-500/10 to-dragonfly-teal-500/10 rounded-2xl border border-dragonfly-orange-500/20 shadow-soft animate-fade-in">
      <div className="text-3xl font-black text-dragonfly-orange-400 leading-none">
        {daysSince + 1}
      </div>
      <p className="text-caption font-bold text-dragonfly-orange-300 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
