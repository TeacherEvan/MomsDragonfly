"use client";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface TicketScannerProps {
  onCapture: (blob: Blob) => void;
  isProcessing?: boolean;
}

export function TicketScanner({ onCapture, isProcessing }: TicketScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setHasCamera(false);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        streamRef.current = s;
        setHasCamera(true);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(() => setHasCamera(false));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      "image/jpeg",
      0.85
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
  };

  return (
    <div className="bg-surface-900/80 backdrop-blur-sm rounded-2xl border border-neutral-800 shadow-soft p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-neutral-50 text-sm md:text-base">
          Scan Receipt or Ticket
        </h3>
        <span className="text-caption text-primary-400 bg-primary-500/15 px-2 py-0.5 rounded-full font-semibold">
          Offline OCR
        </span>
      </div>

      {hasCamera ? (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-3 inset-x-0 flex justify-center">
            <button
              type="button"
              onClick={capture}
              disabled={isProcessing}
              className={cn(
                "px-5 py-2.5 rounded-full bg-primary-500 text-neutral-950 font-bold text-xs md:text-sm shadow-glow flex items-center gap-2 transition-all duration-fast active:scale-[0.98]",
                isProcessing && "opacity-60 cursor-not-allowed"
              )}
            >
              {isProcessing ? "Analyzing..." : "📸 Take Photo"}
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-neutral-700 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-500/10 transition-all text-center">
          <span className="text-3xl">📷</span>
          <span className="text-sm font-semibold text-neutral-300">
            Select or take ticket photo
          </span>
          <span className="text-caption text-neutral-500">
            JPEG, PNG, WebP supported
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </label>
      )}
    </div>
  );
}
