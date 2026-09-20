"use client";
import Link from "next/link";
import { BottomNav } from "@/components/shell/BottomNav";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🦋
          </span>
          <span className="font-bold text-lg text-brand-900 tracking-tight">
            Mom&apos;s Dragonfly
          </span>
        </div>
        <Link
          href="/settings"
          className="p-2 rounded-lg text-gray-500 hover:text-brand-700 hover:bg-brand-50 transition-colors min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center"
          aria-label="Settings"
        >
          ⚙️
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-brand-600 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Page not found</h2>
          <p className="text-neutral-600 mb-6">
            Looks like you took a wrong turn. No worries — let&apos;s get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/explore"
              className="bg-primary-500 hover:bg-primary-400 text-neutral-950 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
            >
              Explore Places
            </Link>
            <Link
              href="/budget"
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
            >
              Trip Budget
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-3">
            <Link
              href="/reminders"
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
            >
              Reminders
            </Link>
            <Link
              href="/tickets"
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold py-3 px-6 rounded-xl transition-colors min-h-[var(--touch-target)]"
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