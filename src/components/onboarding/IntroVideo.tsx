"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface IntroVideoProps {
  onDismiss: () => void;
}

export function IntroVideo({ onDismiss }: IntroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="p-4 bg-gradient-to-br from-brand-50 to-green-50 rounded-2xl border border-brand-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <h3 className="font-bold text-gray-900 text-sm md:text-base">
            Welcome to Mom&apos;s Dragonfly
          </h3>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 text-sm font-semibold p-1"
          aria-label="Close intro video"
        >
          ✕
        </button>
      </div>

      <div className="relative aspect-video w-full rounded-xl bg-gray-900 flex flex-col items-center justify-center text-white overflow-hidden shadow-inner">
        {isPlaying ? (
          <video
            controls
            autoPlay
            className="w-full h-full object-cover"
            src="/intro.mp4"
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="text-center p-4">
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center text-xl shadow-lg transition-transform hover:scale-105 mx-auto mb-2"
              aria-label="Play introduction video"
            >
              ▶
            </button>
            <p className="text-xs text-gray-300">
              Quick 1-minute tour: Explore, Budget, Reminders &amp; Ticket OCR
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
        <span>No sign-in needed &bull; Offline ready</span>
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "text-brand-700 font-semibold underline underline-offset-2",
            "min-h-[var(--touch-target)] flex items-center"
          )}
        >
          Got it, let&apos;s explore &rarr;
        </button>
      </div>
    </div>
  );
}
