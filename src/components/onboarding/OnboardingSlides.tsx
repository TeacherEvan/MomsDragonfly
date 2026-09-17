"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";

const SLIDES = [
  {
    icon: "🗺️",
    title: "Proximity-First Discovery",
    description:
      "Find verified clean restrooms, top local eats, pharmacies, and sights within walking distance. Verified by real travelers.",
  },
  {
    icon: "💰",
    title: "Simple Daily Budgeting",
    description:
      "Keep daily and trip expenses under control with our visual budget ring. Completely offline and private on your device.",
  },
  {
    icon: "🎟️",
    title: "Instant Ticket & Receipt OCR",
    description:
      "Snap a photo of tour tickets or meal receipts. We extract dates, venues, and amounts automatically.",
  },
];

interface OnboardingSlidesProps {
  onFinish: () => void;
}

export function OnboardingSlides({ onFinish }: OnboardingSlidesProps) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1);
    } else {
      onFinish();
    }
  };

  const slide = SLIDES[current];

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-md flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl mb-4 shadow-sm">
        {slide.icon}
      </div>

      <h3 className="text-base font-bold text-gray-900 mb-2">{slide.title}</h3>
      <p className="text-xs md:text-sm text-gray-600 max-w-xs mb-6 leading-relaxed">
        {slide.description}
      </p>

      {/* Slide Indicators */}
      <div className="flex gap-1.5 mb-6">
        {SLIDES.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1.5 rounded-full transition-all",
              idx === current ? "w-6 bg-brand-600" : "w-1.5 bg-gray-200"
            )}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={next}
        className={cn(
          "w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-98",
          "min-h-[var(--touch-target)]"
        )}
      >
        {current === SLIDES.length - 1 ? "Start Exploring" : "Next"}
      </button>
    </div>
  );
}
