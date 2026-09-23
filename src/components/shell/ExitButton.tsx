"use client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shell/Toast";
import { cn } from "@/lib/utils/cn";

export function ExitButton({ className }: { className?: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  const handleExit = () => {
    if (!confirm("Exit Mom's Dragonfly?")) return;
    try {
      window.close();
    } catch {
      // ignore — fallback below
    }
    // window.close() is blocked unless the window was opened via script.
    // If we're still here after a tick, fall back to a graceful exit hint.
    window.setTimeout(() => {
      if (!window.closed) {
        showToast({
          message: "Use your device back button or gesture to exit the app",
          type: "info",
          duration: 4000,
        });
        router.push("/explore");
      }
    }, 150);
  };

  return (
    <button
      type="button"
      data-testid="exit-button"
      onClick={handleExit}
      className={cn(
        "w-full border border-dragonfly-rose-500/60 text-dragonfly-rose-400 hover:text-dragonfly-rose-300 hover:bg-dragonfly-rose-500/10 font-semibold py-3 rounded-xl text-sm transition-all duration-fast active:scale-[0.98]",
        "min-h-[var(--touch-target)]",
        className
      )}
    >
      Exit App
    </button>
  );
}
