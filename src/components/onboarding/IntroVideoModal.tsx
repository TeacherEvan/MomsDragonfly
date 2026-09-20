"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

interface IntroVideoModalProps {
  onComplete: () => void;
}

export function IntroVideoModal({ onComplete }: IntroVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExitAnimation, setShowExitAnimation] = useState(false);
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }
    setShowExitAnimation(true);
    setTimeout(() => onComplete(), 300);
  }, [prefersReducedMotion, onComplete]);

  const handleVideoEnd = useCallback(() => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }
    setShowExitAnimation(true);
    setTimeout(() => onComplete(), 500);
  }, [prefersReducedMotion, onComplete]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") handleSkip();
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (isPlaying) {
        videoRef.current?.pause();
      } else {
        handlePlay();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, handlePlay, handleSkip]);

  const handleKeyDownReact = (e: React.KeyboardEvent) => {
    handleKeyDown(e.nativeEvent);
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, handlePlay, handleSkip]);

  if (showExitAnimation) {
    return (
      <div data-testid="video-modal-overlay" className="fixed inset-0 z-50 bg-black/90">
        <div className="fixed top-4 right-4 pointer-events-none transition-all duration-300 ease-out translate-x-full opacity-0">
          <DragonflySilhouette size="lg" animated={!prefersReducedMotion} decorative />
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="video-modal-overlay"
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onKeyDown={handleKeyDownReact}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      <video
        data-testid="intro-video"
        ref={videoRef}
        poster="/intro.jpg"
        preload="metadata"
        className="max-w-full max-h-full object-contain"
        onEnded={handleVideoEnd}
      />
      {!isPlaying && (
        <button
          data-testid="play-button"
          type="button"
          onClick={handlePlay}
          className="fixed bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-dragonfly-gold-500 hover:bg-dragonfly-gold-400 text-dragonfly-navy-950 flex items-center justify-center text-2xl md:text-3xl shadow-[0_0_24px_rgba(212,175,55,0.5)] transition-all duration-200 hover:scale-105"
          aria-label="Play introduction video"
        >
          ▶
        </button>
      )}
      <button
        data-testid="skip-button"
        type="button"
        onClick={handleSkip}
        className="fixed top-6 right-6 px-4 py-2 text-dragonfly-gold-400 hover:text-dragonfly-gold-300 font-semibold text-sm transition-colors"
        aria-label="Skip intro video"
      >
        Skip
      </button>
    </div>
  );
}