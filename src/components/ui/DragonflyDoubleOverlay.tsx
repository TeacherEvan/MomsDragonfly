"use client";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

interface DragonflyDoubleOverlayProps {
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
  children,
  className,
  imageSrc = "/dragonfly-backdrop.jpg",
}: DragonflyDoubleOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const layersRef = useRef<LayerState[]>([
    { x: 0, y: 0, scale: 1.15, rotation: 0, opacity: 0.28, blur: 1.5 },
    { x: 0, y: 0, scale: 1.08, rotation: 0, opacity: 0.22, blur: 0 },
  ]);

  // Check reduced motion (both CSS class and media query)
  useEffect(() => {
    setMounted(true);

    const checkReduceMotion = () => {
      const mediaQuery = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const classCheck = typeof document !== "undefined" && document.documentElement.classList.contains("reduce-motion");
      setReduceMotion(Boolean(mediaQuery || classCheck));
    };

    checkReduceMotion();

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMediaChange = () => checkReduceMotion();
    media.addEventListener("change", onMediaChange);

    const observer = new MutationObserver(() => checkReduceMotion());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      media.removeEventListener("change", onMediaChange);
      observer.disconnect();
    };
  }, []);

  // Load image
  useEffect(() => {
    let active = true;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      if (!active) return;
      imageRef.current = img;
      setImgReady(true);
    };
    return () => {
      active = false;
      imageRef.current = null;
    };
  }, [imageSrc]);

  // Perlin noise generator
  const noiseRef = useRef<((x: number, y: number, z: number) => number) | null>(null);
  if (!noiseRef.current) {
    const perm = new Array(512);
    const grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
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
        lerp(
          lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
          lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u),
          v
        ),
        lerp(
          lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
          lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u),
          v
        ),
        w
      );
    };
  }

  const noise = noiseRef.current;
  const shouldAnimate = !reduceMotion && mounted && imgReady;

  useEffect(() => {
    if (!shouldAnimate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: false, alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let lastDraw = 0;
    const interval = 1000 / 30; // Cap to 30 fps

    const animate = (time: number) => {
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (time - lastDraw < interval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastDraw = time;

      if (!canvasRef.current || !imageRef.current) return;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const img = imageRef.current;
      const t = time * 0.001; // seconds

      ctx.clearRect(0, 0, width, height);

      layersRef.current.forEach((layer, i) => {
        const seedX = i === 0 ? 100 : 250;
        const seedY = i === 0 ? 300 : 450;
        const freq = i === 0 ? 0.05 : 0.08;

        const imgAspect = img.width / img.height;
        const viewAspect = width / height;
        let drawW = 0, drawH = 0;

        if (imgAspect > viewAspect) {
          drawH = height * layer.scale;
          drawW = drawH * imgAspect;
        } else {
          drawW = width * layer.scale;
          drawH = drawW / imgAspect;
        }

        const maxShiftX = Math.max(0, (drawW - width) * 0.4);
        const maxShiftY = Math.max(0, (drawH - height) * 0.4);

        layer.x = noise(t * freq + seedX, 0, 0) * maxShiftX;
        layer.y = noise(0, t * freq + seedY, 0) * maxShiftY;
        layer.scale = (i === 0 ? 1.15 : 1.08) + noise(t * 0.02 + 500 + i * 10, 0, 0) * 0.015;
        layer.rotation = noise(0, 0, t * 0.01 + 700 + i * 10) * 0.01;
        layer.opacity = (i === 0 ? 0.28 : 0.22) + noise(t * 0.02 + 900 + i * 10, 0, 0) * 0.02;

        const drawX = (width - drawW) * 0.5 + layer.x;
        const drawY = (height - drawH) * 0.5 + layer.y;

        ctx.save();
        ctx.translate(width * 0.5, height * 0.5);
        ctx.rotate(layer.rotation);
        ctx.translate(-width * 0.5, -height * 0.5);

        ctx.globalCompositeOperation = i === 0 ? "source-over" : "soft-light";
        ctx.globalAlpha = Math.max(0.1, Math.min(0.4, layer.opacity));
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();
      });

      // Subtle vignette overlay
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

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [shouldAnimate, imageSrc, noise]);

  // If SSR or reduced-motion is requested, render static fallback
  if (!mounted || reduceMotion) {
    return (
      <div className={cn("relative isolate flex flex-col min-h-screen bg-dragonfly-navy-950", className)}>
        <div className="absolute inset-0 bg-wing-pattern opacity-30 pointer-events-none" aria-hidden="true" />
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
        <div className="relative z-10 flex flex-col flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className={cn("relative isolate flex flex-col min-h-screen bg-dragonfly-navy-950", className)}>
      <div className="absolute inset-0 bg-wing-pattern opacity-30 pointer-events-none" aria-hidden="true" />

      {/* Dynamic canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-10 pointer-events-none"
        aria-hidden="true"
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(6, 20, 22, 0.55) 0%, rgba(6, 20, 22, 0.25) 50%, rgba(6, 20, 22, 0.55) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col flex-1">{children}</div>
    </div>
  );
}