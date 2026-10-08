"use client";
import { AnimatePresence, motion } from "framer-motion";
import React from "react";

import { cn } from "@/lib/utils/cn";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-dragonfly-navy-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="relative z-10 w-full max-w-sm glass-panel rounded-2xl p-6 shadow-strong border border-dragonfly-navy-700 bg-dragonfly-navy-900/95"
            initial={{ scale: 0.92, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
          >
            <h3 id="confirm-title" className="font-bold text-dragonfly-navy-50 text-base mb-2">
              {title}
            </h3>
            <p id="confirm-message" className="text-caption text-dragonfly-navy-300 mb-6 leading-relaxed">
              {message}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-xl border border-dragonfly-navy-700 text-dragonfly-navy-200 font-semibold py-2.5 min-h-[var(--touch-target)] transition-colors hover:bg-dragonfly-navy-800 active:scale-[0.98] text-sm"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  "flex-1 rounded-xl font-semibold py-2.5 min-h-[var(--touch-target)] transition-colors active:scale-[0.98] text-sm",
                  danger
                    ? "bg-dragonfly-rose-500 hover:bg-dragonfly-rose-400 text-dragonfly-navy-50"
                    : "bg-dragonfly-orange-500 hover:bg-dragonfly-orange-400 text-dragonfly-navy-950"
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
