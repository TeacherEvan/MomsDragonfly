"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";
import { ParticleCanvas } from "@/components/ui/ParticleCanvas";

interface IntroVideoModalProps {
  onComplete: () => void;
}

export function IntroVideoModal({ onComplete }: IntroVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showExitAnimation, setShowExitAnimation] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const hasPlayedRef = useRef(false);
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Auto-play on mount (with fallback if blocked by browser)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setIsPlaying(false);
      });
    }
  }, [prefersReducedMotion]);

  // If the video still hasn't started after 8s (slow/blocked network),
  // offer a clear way to continue — never trap the user on a black screen.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!hasPlayedRef.current) setShowFallback(true);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // Entrance animation trigger
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  const handlePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  }, []);

  const handlePlaying = useCallback(() => {
    hasPlayedRef.current = true;
    setShowFallback(false);
    setIsPlaying(true);
    setIsBuffering(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
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
      <motion.div
        data-testid="video-modal-overlay"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.5 }}
        className="fixed inset-0 z-50 bg-black/90"
      >
        <motion.div
          className="fixed top-4 right-4 pointer-events-none"
          initial={{ x: 0, opacity: 1 }}
          animate={{ x: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <DragonflySilhouette size="lg" animated={!prefersReducedMotion} decorative />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      data-testid="video-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 0.4 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onKeyDown={handleKeyDownReact}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      <ParticleCanvas 
        particleCount={20} 
        dragonflyCount={2} 
        prefersReducedMotion={prefersReducedMotion} 
        className="opacity-30"
      />
      <motion.video
        data-testid="intro-video"
        ref={videoRef}
        src="/Intro.mp4"
        poster="/intro.jpg"
        preload="auto"
        className="max-w-full max-h-full object-contain"
        onEnded={handleVideoEnd}
        onPlaying={handlePlaying}
        onError={() => setShowFallback(true)}
        onPause={handlePause}
        onWaiting={handleWaiting}
        muted
        playsInline
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.6, delay: 0.1, ease: "easeOut" }}
      />
      <AnimatePresence mode="wait">
        {!isPlaying && !showFallback && (
          <motion.button
            data-testid="play-button"
            type="button"
            onClick={handlePlay}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: mounted ? 0.3 : 0 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-dragonfly-gold-500 hover:bg-dragonfly-gold-400 text-dragonfly-navy-950 flex items-center justify-center text-2xl md:text-3xl shadow-[0_0_24px_rgba(212,175,55,0.5)] transition-all duration-200 hover:scale-105"
            aria-label={isBuffering ? "Loading video..." : "Play introduction video"}
            disabled={isBuffering}
          >
            {isBuffering ? (
              <motion.svg
                className="w-6 h-6 md:w-8 md:h-8 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <motion.path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 12 12"
                    to="360 12 12"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </motion.path>
              </motion.svg>
            ) : (
              "▶"
            )}
          </motion.button>
        )}
      </AnimatePresence>
      {showFallback && (
        <div className="fixed inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 px-6">
          <p className="text-caption text-dragonfly-navy-300 bg-dragonfly-navy-900/90 border border-dragonfly-navy-700 rounded-xl px-4 py-2 text-center">
            The video is slow to load — you can continue to the app.
          </p>
          <button
            type="button"
            onClick={handleSkip}
            className="px-5 py-2.5 rounded-full bg-dragonfly-gold-500 hover:bg-dragonfly-gold-400 text-dragonfly-navy-950 font-bold text-sm transition-colors duration-fast"
          >
            Continue
          </button>
        </div>
      )}
      <motion.button
        data-testid="skip-button"
        type="button"
        onClick={handleSkip}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="fixed top-6 right-6 px-4 py-2 text-dragonfly-gold-400 hover:text-dragonfly-gold-300 font-semibold text-sm transition-colors"
        aria-label="Skip intro video"
      >
        Skip
      </motion.button>
    </motion.div>
  );
}
