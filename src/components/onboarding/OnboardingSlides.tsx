"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-md flex flex-col items-center text-center relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full flex flex-col items-center text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl mb-4 shadow-sm"
          >
            {slide.icon}
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            className="text-base font-bold text-gray-900 mb-2"
          >
            {slide.title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
            className="text-xs md:text-sm text-gray-600 max-w-xs mb-6 leading-relaxed"
          >
            {slide.description}
          </motion.p>

          {/* Slide Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="flex gap-1.5 mb-6"
          >
            {SLIDES.map((_, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.5 }}
                animate={{ scale: idx === current ? 1.5 : 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === current ? "w-6 bg-brand-600" : "w-1.5 bg-gray-200"
                )}
              />
            ))}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            onClick={next}
            className={cn(
              "w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all active:scale-98",
              "min-h-[var(--touch-target)]"
            )}
            whileTap={{ scale: 0.98 }}
          >
            {current === SLIDES.length - 1 ? "Start Exploring" : "Next"}
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}