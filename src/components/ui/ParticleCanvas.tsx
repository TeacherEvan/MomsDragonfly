"use client";
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { dragonflyPalette } from "@/lib/theme/dragonfly";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
  isDragonfly: boolean;
  wingPhase: number;
}

interface ParticleCanvasProps {
  className?: string;
  particleCount?: number;
  dragonflyCount?: number;
  prefersReducedMotion?: boolean;
}

export function ParticleCanvas({
  className = "",
  particleCount = 30,
  dragonflyCount = 3,
  prefersReducedMotion = false,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);

  const colors = useMemo(() => [
    dragonflyPalette.gold[400],
    dragonflyPalette.gold[500],
    dragonflyPalette.cyan[400],
    dragonflyPalette.teal[400],
    dragonflyPalette.emerald[400],
  ], []);

  const initParticles = useCallback((width: number, height: number) => {
    const newParticles: Particle[] = [];
    
    // Ambient particles
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 200,
        isDragonfly: false,
        wingPhase: 0,
      });
    }

    // Dragonfly particles
    for (let i = 0; i < dragonflyCount; i++) {
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8 - 0.2,
        size: Math.random() * 8 + 12,
        opacity: 0.6 + Math.random() * 0.3,
        color: dragonflyPalette.teal[400],
        life: 0,
        maxLife: 999999,
        isDragonfly: true,
        wingPhase: Math.random() * Math.PI * 2,
      });
    }

    particlesRef.current = newParticles;
  }, [particleCount, dragonflyCount, colors]);

  const drawDragonfly = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    const { x, y, size, opacity, wingPhase } = p;
    const bodyLength = size * 1.5;
    const wingSpan = size * 1.8;
    const wingHeight = size * 0.8;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = opacity;

    // Wings with shimmer
    const wingOpacity = 0.3 + Math.sin(wingPhase) * 0.15;
    
    // Upper wings
    ctx.beginPath();
    ctx.ellipse(-wingSpan * 0.5, -bodyLength * 0.3, wingSpan * 0.5, wingHeight, -0.4, 0, Math.PI * 2);
    ctx.ellipse(wingSpan * 0.5, -bodyLength * 0.3, wingSpan * 0.5, wingHeight, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(50, 184, 198, ${wingOpacity})`;
    ctx.fill();

    // Lower wings
    ctx.beginPath();
    ctx.ellipse(-wingSpan * 0.4, bodyLength * 0.2, wingSpan * 0.4, wingHeight * 0.7, -0.5, 0, Math.PI * 2);
    ctx.ellipse(wingSpan * 0.4, bodyLength * 0.2, wingSpan * 0.4, wingHeight * 0.7, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(16, 185, 129, ${wingOpacity * 0.8})`;
    ctx.fill();

    // Body segments
    const segments = 4;
    for (let i = 0; i < segments; i++) {
      const segmentY = (i - segments / 2) * (bodyLength / segments);
      const radius = size * (0.6 - i * 0.1);
      ctx.beginPath();
      ctx.arc(0, segmentY, radius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(0, segmentY, 0, 0, segmentY, radius);
      grad.addColorStop(0, dragonflyPalette.teal[400]);
      grad.addColorStop(1, dragonflyPalette.teal[700]);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Eyes
    ctx.beginPath();
    ctx.arc(-size * 0.25, -bodyLength * 0.5, size * 0.15, 0, Math.PI * 2);
    ctx.arc(size * 0.25, -bodyLength * 0.5, size * 0.15, 0, Math.PI * 2);
    const eyeGrad = ctx.createRadialGradient(-size * 0.25, -bodyLength * 0.5, 0, -size * 0.25, -bodyLength * 0.5, size * 0.15);
    eyeGrad.addColorStop(0, dragonflyPalette.gold[100]);
    eyeGrad.addColorStop(1, dragonflyPalette.gold[400]);
    ctx.fillStyle = eyeGrad;
    ctx.fill();

    // Antennae
    ctx.strokeStyle = dragonflyPalette.navy[900];
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = opacity * 0.6;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -bodyLength * 0.5);
    ctx.quadraticCurveTo(-size * 0.8, -bodyLength * 0.8, -size * 1, -bodyLength * 1);
    ctx.moveTo(size * 0.3, -bodyLength * 0.5);
    ctx.quadraticCurveTo(size * 0.8, -bodyLength * 0.8, size * 1, -bodyLength * 1);
    ctx.stroke();

    ctx.restore();
  }, []);

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const deltaTime = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // Clear with slight trail effect
    ctx.fillStyle = "rgba(6, 20, 22, 0.15)";
    ctx.fillRect(0, 0, width, height);

    // Update and draw particles
    particlesRef.current.forEach((p) => {
      if (p.isDragonfly) {
        // Dragonfly movement - gentle wandering
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02 - 0.005;
        
        // Clamp velocity
        const maxSpeed = 0.8;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        p.x += p.vx * deltaTime * 0.06;
        p.y += p.vy * deltaTime * 0.06;
        p.wingPhase += deltaTime * 0.015;

        // Wrap around screen
        if (p.x < -50) p.x = width + 50;
        if (p.x > width + 50) p.x = -50;
        if (p.y < -50) p.y = height + 50;
        if (p.y > height + 50) p.y = -50;

        drawDragonfly(ctx, p);
      } else {
        // Ambient particles
        p.x += p.vx * deltaTime * 0.06;
        p.y += p.vy * deltaTime * 0.06;
        p.life += deltaTime * 0.01;

        // Fade in/out based on life
        const lifeRatio = p.life / p.maxLife;
        const currentOpacity = p.opacity * (1 - Math.abs(lifeRatio - 0.5) * 2);

        if (p.life > p.maxLife) {
          // Respawn
          p.x = Math.random() * width;
          p.y = height + 10;
          p.life = 0;
          p.maxLife = 100 + Math.random() * 200;
          p.vx = (Math.random() - 0.5) * 0.3;
          p.vy = (Math.random() - 0.5) * 0.3 - 0.1;
          p.size = Math.random() * 2 + 0.5;
          p.opacity = Math.random() * 0.4 + 0.1;
          p.color = colors[Math.floor(Math.random() * colors.length)];
        }

        // Wrap horizontally
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace("rgb", "rgba").replace(")", `, ${currentOpacity})`);
        ctx.fill();
      }
    });

    if (!prefersReducedMotion) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [prefersReducedMotion, drawDragonfly, colors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      initParticles(canvas.offsetWidth, canvas.offsetHeight);
    };

    resize();
    window.addEventListener("resize", resize);
    
    if (!prefersReducedMotion) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [prefersReducedMotion, particleCount, dragonflyCount, animate, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}