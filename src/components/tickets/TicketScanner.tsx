"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/Icon";
import { normalizeImage } from "@/lib/images/normalize";

interface TicketScannerProps {
  onCapture: (blob: Blob) => void;
  isProcessing?: boolean;
}

export function TicketScanner({ onCapture, isProcessing }: TicketScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  // Clean up the stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported on this device — choose a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setCameraError("Camera unavailable — choose a photo instead.");
    }
  }, []);

  // Attach the stream once the video element exists
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => {});
    }
  }, [cameraOn]);

  const captureFromCamera = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const raw = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9)
    );
    stopCamera();
    if (raw) onCapture(await normalizeImage(raw));
  }, [onCapture, stopCamera]);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so selecting the same file again still fires onChange
      e.target.value = "";
      if (file) onCapture(await normalizeImage(file));
    },
    [onCapture]
  );

  if (cameraOn) {
    return (
      <div className="bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-2xl border border-dragonfly-navy-700 shadow-soft p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-dragonfly-navy-50 text-sm md:text-base">
            Scan Receipt or Ticket
          </h3>
          <span className="text-caption text-dragonfly-teal-400 bg-dragonfly-teal-500/15 px-2 py-0.5 rounded-full font-semibold">
            Camera
          </span>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-3">
            <button
              type="button"
              onClick={captureFromCamera}
              disabled={isProcessing}
              className={cn(
                "px-5 py-2.5 rounded-full bg-dragonfly-teal-500 text-dragonfly-navy-950 font-bold text-xs md:text-sm shadow-[0_0_20px_rgba(49,151,149,0.3)] flex items-center gap-2 transition-all duration-fast active:scale-[0.98]",
                isProcessing && "opacity-60 cursor-not-allowed"
              )}
            >
              {isProcessing ? "Saving…" : "Capture"}
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-5 py-2.5 rounded-full bg-dragonfly-navy-800/90 border border-dragonfly-navy-600 text-dragonfly-navy-200 font-semibold text-xs md:text-sm transition-all duration-fast active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dragonfly-navy-800/80 backdrop-blur-sm rounded-2xl border border-dragonfly-navy-700 shadow-soft p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-dragonfly-navy-50 text-sm md:text-base">
          Scan Receipt or Ticket
        </h3>
        <span className="text-caption text-dragonfly-teal-400 bg-dragonfly-teal-500/15 px-2 py-0.5 rounded-full font-semibold">
          Offline OCR
        </span>
      </div>

      <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-dragonfly-navy-700 rounded-xl cursor-pointer hover:border-dragonfly-teal-500 hover:bg-dragonfly-teal-500/10 transition-all text-center">
        <span className="text-dragonfly-teal-400" aria-hidden="true">
          <Icon name="camera" size={32} />
        </span>
        <span className="text-sm font-semibold text-dragonfly-navy-200">
          Take or choose a ticket photo
        </span>
        <span className="text-caption text-dragonfly-navy-400">
          JPEG, PNG, WebP — stored on your device
        </span>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFile}
          disabled={isProcessing}
        />
      </label>

      <button
        type="button"
        onClick={startCamera}
        disabled={isProcessing}
        className="mt-3 w-full py-2.5 rounded-xl border border-dragonfly-navy-600 text-dragonfly-navy-200 hover:bg-dragonfly-navy-700/60 font-semibold text-caption transition-all duration-fast active:scale-[0.99]"
      >
        Use live camera instead
      </button>

      {cameraError && (
        <p className="mt-2 text-caption text-dragonfly-amber-400">{cameraError}</p>
      )}
    </div>
  );
}
