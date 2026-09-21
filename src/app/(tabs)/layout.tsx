"use client";
export const dynamic = "force-dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BottomNav } from "@/components/shell/BottomNav";
import { CookieConsent } from "@/components/shell/CookieConsent";
import { InstallPrompt } from "@/components/shell/InstallPrompt";
import { UpdateBanner } from "@/components/shell/UpdateBanner";
import { cn } from "@/lib/utils/cn";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex flex-col min-h-screen bg-dragonfly-navy-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-dragonfly-gold-500 focus:text-dragonfly-navy-950 focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-dragonfly-gold-500 focus:ring-offset-2 focus:ring-offset-dragonfly-navy-950"
      >
        Skip to main content
      </a>
      <InstallPrompt />
      <UpdateBanner />
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-dragonfly-navy-950/95 backdrop-blur-sm border-b border-dragonfly-navy-800">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-2xl"
            aria-hidden="true"
          >
            <DragonflySilhouette size="lg" animated={true} decorative aria-hidden="true" />
          </motion.div>
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="font-bold text-lg text-dragonfly-navy-50 tracking-tight bg-gradient-to-r from-dragonfly-cyan-300 via-dragonfly-teal-400 to-dragonfly-emerald-400 bg-clip-text text-transparent animate-iridescent-shift"
          >
            Mom&apos;s Dragonfly
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          <motion.div
            onClick={() => router.push("/settings")}
            className={cn(
              "p-2 rounded-xl text-dragonfly-navy-400 hover:text-dragonfly-gold-400 hover:bg-dragonfly-navy-800 transition-all duration-fast cursor-pointer",
              "min-h-[var(--touch-target)] min-w-[var(--touch-target)] flex items-center justify-center"
            )}
            aria-label="Settings"
            whileTap={{ scale: 0.9 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push("/settings"); }}
          >
            ⚙️
          </motion.div>
        </div>
      </header>

      <main id="main-content" className="flex-1 pb-20">{children}</main>

      <BottomNav />
      <CookieConsent />
    </div>
  );
}
