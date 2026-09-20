"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface IntroVideoProps {
  onDismiss: () => void;
}

export function IntroVideo({ onDismiss }: IntroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

return (
    <div className="p-4 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-2xl border border-primary-500/20 shadow-soft relative overflow-hidden animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <h3 className="font-bold text-neutral-50 text-sm md:text-base">
            Welcome to Mom&apos;s Dragonfly
          </h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-50 text-sm font-semibold p-1 transition-colors duration-fast"
          aria-label="Close intro video"
        >
          ✕
        </button>
      </div>

      <div className="relative aspect-video w-full rounded-xl bg-surface-950 flex flex-col items-center justify-center text-white overflow-hidden shadow-inner border border-neutral-800">
        {isPlaying ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400">
            Intro video unavailable
          </div>
        ) : (
          <div className="text-center p-4">
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary-500 hover:bg-primary-400 text-neutral-950 flex items-center justify-center text-xl shadow-glow transition-all duration-fast hover:scale-105 mx-auto mb-2"
              aria-label="Play introduction video"
            >
              ▶
            </button>
            <p className="text-caption text-neutral-400">
              Quick 1-minute tour: Explore, Budget, Reminders & Ticket OCR
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center text-caption text-neutral-400">
        <span>No sign-in needed &bull; Offline ready</span>
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "text-primary-400 font-semibold underline underline-offset-2 hover:text-primary-300 transition-colors duration-fast",
            "min-h-[var(--touch-target)] flex items-center"
          )}
        >
          Got it, let&apos;s explore &rarr;
        </button>
      </div>
    </div>
  );
}
