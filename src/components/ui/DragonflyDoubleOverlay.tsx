"use client";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

interface DragonflyDoubleOverlayProps {
  mode?: "ambient" | "immersive";
  children: React.ReactNode;
  className?: string;
  imageSrc?: string;
}

interface LayerState {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blur: number;
}

export function DragonflyDoubleOverlay({
  mode = "ambient",
  children,
  className,
  imageSrc = "/dragonfly-backdrop.jpg",
}: DragonflyDoubleOverlayProps) {
  const prefersReducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const timeRef = useRef(0);
  const layersRef = useRef<LayerState[]>([
    // Layer 1: base layer - larger, slower, slightly blurred
    { x: 0, y: 0, scale: 1.15, rotation: 0, opacity: 0.28, blur: 1.5 },
    // Layer 2: overlay layer - smaller, faster, sharper, offset
    { x: 0, y: 0, scale: 1.05, rotation: 0, opacity: 0.22, blur: 0 },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
    };
    return () => {
      imageRef.current = null;
    };
  }, [imageSrc]);

  // Perlin noise implementation for organic motion
  const noiseRef = useRef<((x: number, y: number, z: number) => number) | null>(null);

  if (!noiseRef.current) {
    const perm = new Array(512);
    const grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a: number, b: number, t: number) => a + t * (b - a);
    const grad = (hash: number, x: number, y: number, z: number) => {
      const g = grad3[hash % 12];
      return g[0] * x + g[1] * y + g[2] * z;
    };

    noiseRef.current = (x: number, y: number, z: number) => {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const Z = Math.floor(z) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z);
      const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
      const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
      return lerp(
        lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
             lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
        lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
             lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w);
    };
  }

  const noise = noiseRef.current;

  const shouldAnimate = !prefersReducedMotion && mounted && imageRef.current;

  useEffect(() => {
    if (!shouldAnimate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false, alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = (time: number) => {
      if (!canvasRef.current || !imageRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const img = imageRef.current;

      timeRef.current = time;
      const t = time * 0.001; // seconds

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Update and render each layer with organic noise-based motion
      layersRef.current.forEach((layer, i) => {
        // Different noise seeds and frequencies per layer
        const seedX = i === 0 ? 1000 : 2000;
        const seedY = i === 0 ? 3000 : 4000;
        const freq = i === 0 ? 0.0003 : 0.0005; // Layer 2 moves faster
        const amp = i === 0 ? 80 : 120; // Layer 2 has larger movement range

        // Primary drift using Perlin noise
        layer.x = noise(t * freq + seedX, 0, 0) * amp;
        layer.y = noise(0, t * freq + seedY, 0) * amp;

        // Slow breathing scale
        layer.scale = (i === 0 ? 1.15 : 1.05) + noise(t * 0.0001 + 5000 + i * 100, 0, 0) * 0.02;

        // Subtle rotation drift
        layer.rotation = noise(0, 0, t * 0.00005 + 7000 + i * 100) * 0.015; // ~0.85 degrees max

        // Opacity breathes slightly
        layer.opacity = (i === 0 ? 0.28 : 0.22) + noise(t * 0.00008 + 9000 + i * 100, 0, 0) * 0.03;

        // Calculate draw rect to cover viewport with scale
        const imgAspect = img.width / img.height;
        const viewAspect = width / height;
        let drawW = 0, drawH = 0;
        let drawX = 0, drawY = 0;

        if (imgAspect > viewAspect) {
          drawH = height * layer.scale;
          drawW = drawH * imgAspect;
        } else {
          drawW = width * layer.scale;
          drawH = drawW / imgAspect;
        }

        drawX = (width - drawW) * 0.5 + layer.x;
        drawY = (height - drawH) * 0.5 + layer.y;

        // Save context for this layer
        ctx.save();
        
        // Move to center for rotation
        ctx.translate(width * 0.5, height * 0.5);
        ctx.rotate(layer.rotation);
        ctx.translate(-width * 0.5, -height * 0.5);

        // Apply blur via filter (Layer 1 only)
        if (layer.blur > 0) {
          ctx.filter = `blur(${layer.blur}px)`;
        }

        // Blend mode for depth interaction
        ctx.globalCompositeOperation = i === 0 ? "source-over" : "soft-light";
        ctx.globalAlpha = Math.max(0.1, Math.min(0.4, layer.opacity));

        // Draw image
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        ctx.restore();
      });

      // Subtle vignette overlay to blend edges
      const vignette = ctx.createRadialGradient(
        width * 0.5, height * 0.5, Math.min(width, height) * 0.3,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.7
      );
      vignette.addColorStop(0, "rgba(6, 20, 22, 0)");
      vignette.addColorStop(1, "rgba(6, 20, 22, 0.45)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    timeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAnimate, imageSrc]);

  if (!mounted) {
    // SSR fallback - show static image
    return (
      <div className={cn("relative min-h-screen bg-dragonfly-navy-950", className)}>
        <div className="absolute inset-0 bg-wing-pattern opacity-30" aria-hidden="true" />
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: `url("${imageSrc}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: 0.25,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(6, 20, 22, 0.6) 0%, rgba(6, 20, 22, 0.3) 50%, rgba(6, 20, 22, 0.6) 100%)",
          }}
          aria-hidden="true"
        />
        <main className="relative z-10">{children}</main>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-screen bg-dragonfly-navy-950", className)}>
      {/* Base background pattern */}
      <div className="absolute inset-0 bg-wing-pattern opacity-30" aria-hidden="true" />

      {/* Generative canvas backdrop */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* Subtle gradient overlay to blend with app theme */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(6, 20, 22, 0.55) 0%, rgba(6, 20, 22, 0.25) 50%, rgba(6, 20, 22, 0.55) 100%)",
        }}
        aria-hidden="true"
      />

      {mode === "ambient" && (
        <div className="fixed top-8 right-8 pointer-events-none z-10" />
      )}

      <main className="relative z-10">{children}</main>
    </div>
  );
}