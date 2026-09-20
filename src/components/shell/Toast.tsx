"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, "id">) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    const newToast: Toast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration ?? 4000);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-20 inset-x-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up",
              "min-h-[var(--touch-target)] max-w-xl",
              toast.type === "success" && "bg-emerald-500 text-neutral-950",
              toast.type === "error" && "bg-rose-500 text-neutral-50",
              toast.type === "warning" && "bg-amber-500 text-neutral-950",
              toast.type === "info" && "bg-accent-500 text-neutral-950"
            )}
            role="alert"
            aria-live="polite"
          >
            <span className="flex-1 text-sm">{toast.message}</span>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition-colors duration-fast min-h-[var(--touch-target)]"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => hideToast(toast.id)}
              className="text-white/70 hover:text-white p-1 min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function useNetworkToast() {
  const { showToast } = useToast();

  return {
    showOffline: () =>
      showToast({
        message: "Working offline — changes will sync when online",
        type: "info",
        duration: 6000,
      }),
    showOnline: () =>
      showToast({
        message: "Back online — syncing…",
        type: "success",
        duration: 3000,
      }),
    showError: (message: string, action?: { label: string; onClick: () => void }) =>
      showToast({
        message,
        type: "error",
        duration: 0,
        action,
      }),
    showSuccess: (message: string) =>
      showToast({
        message,
        type: "success",
        duration: 3000,
      }),
  };
}