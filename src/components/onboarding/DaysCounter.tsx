"use client";
import React from "react";

interface DaysCounterProps {
  tripStartDate?: number;
}

export function DaysCounter({ tripStartDate }: DaysCounterProps) {
  if (!tripStartDate) {
    return (
      <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-center animate-fade-in">
        <p className="text-caption text-primary-400 font-medium">
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
    <div className="text-center py-3.5 px-4 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-2xl border border-primary-500/20 shadow-soft animate-fade-in">
      <div className="text-3xl font-black text-primary-500 leading-none">
        {daysSince + 1}
      </div>
      <p className="text-caption font-bold text-primary-400 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
