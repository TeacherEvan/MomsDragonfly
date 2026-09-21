"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";
import { ParticleCanvas } from "@/components/ui/ParticleCanvas";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [takeOff, setTakeOff] = useState(false);
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleClick = () => {
    if (prefersReducedMotion) {
      onComplete();
      return;
    }
    setTakeOff(true);
    setTimeout(() => onComplete(), 600);
  };

  return (
    <motion.div
      data-testid="splash-overlay"
      initial={{ opacity: 1 }}
      animate={{ opacity: takeOff ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.01 : 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
    >
      <div
        data-testid="splash-background"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url('/intro.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-dragonfly-navy-950/80 via-dragonfly-navy-950/40 to-dragonfly-navy-950/90" />
      <ParticleCanvas 
        particleCount={25} 
        dragonflyCount={2} 
        prefersReducedMotion={prefersReducedMotion} 
        className="opacity-50"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={takeOff ? "exit" : "enter"}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 2, opacity: 0, y: -100 }}
          transition={{ 
            duration: prefersReducedMotion ? 0.01 : 0.8, 
            ease: "easeOut",
            delay: 0.2
          }}
          className="relative z-10 flex flex-col items-center gap-4 text-center px-6 pointer-events-none"
        >
          <motion.div
            data-testid="splash-dragonfly"
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <DragonflySilhouette size="xl" animated={!prefersReducedMotion} decorative data-testid="dragonfly-silhouette" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="text-3xl md:text-4xl lg:text-5xl font-black bg-gradient-to-r from-dragonfly-cyan-300 via-dragonfly-teal-400 to-dragonfly-emerald-400 bg-clip-text text-transparent animate-iridescent-shift"
          >
            Mom&apos;s Dragonfly
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            className="text-dragonfly-navy-300 text-sm md:text-base font-medium"
          >
            Your travel companion
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
            className="mt-6 flex items-center gap-2 text-dragonfly-gold-400 text-sm font-medium opacity-80"
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Tap to begin
            </motion.span>
            <motion.svg
              className="w-5 h-5"
              animate={{ x: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </motion.svg>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}