"use client";
import Link from "next/link";
import { BottomNav } from "@/components/shell/BottomNav";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-dragonfly-navy-950">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-dragonfly-navy-950/95 backdrop-blur-sm border-b border-dragonfly-navy-800">
        <div className="flex items-center gap-2">
          <DragonflySilhouette size="md" animated={true} decorative aria-hidden="true" />
          <span className="font-bold text-lg text-dragonfly-navy-50 tracking-tight bg-gradient-to-r from-dragonfly-cyan-300 via-dragonfly-teal-400 to-dragonfly-emerald-400 bg-clip-text text-transparent animate-iridescent-shift">
            Mom&apos;s Dragonfly
          </span>
        </div>
        <Link
          href="/settings"
          className="p-2 rounded-lg text-dragonfly-navy-400 hover:text-dragonfly-gold-400 hover:bg-dragonfly-navy-800 transition-colors min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center"
          aria-label="Settings"
        >
          ⚙️
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-dragonfly-teal-500 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-dragonfly-navy-50 mb-4">Page not found</h2>
          <p className="text-dragonfly-navy-400 mb-6">
            Looks like you took a wrong turn. No worries — let&apos;s get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/explore"
              className="bg-dragonfly-teal-500 hover:bg-dragonfly-teal-400 text-dragonfly-navy-950 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
            >
              Explore Places
            </Link>
            <Link
              href="/budget"
              className="bg-dragonfly-navy-800 hover:bg-dragonfly-navy-700 text-dragonfly-navy-50 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
            >
              Trip Budget
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-3">
            <Link
              href="/reminders"
              className="bg-dragonfly-navy-800 hover:bg-dragonfly-navy-700 text-dragonfly-navy-50 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
            >
              Reminders
            </Link>
            <Link
              href="/tickets"
              className="bg-dragonfly-navy-800 hover:bg-dragonfly-navy-700 text-dragonfly-navy-50 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
            >
              Tickets
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}