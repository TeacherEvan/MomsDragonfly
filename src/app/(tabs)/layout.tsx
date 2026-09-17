import { BottomNav } from "@/components/shell/BottomNav";
import { CookieConsent } from "@/components/shell/CookieConsent";
import { ElderlyModeToggle } from "@/components/shell/ElderlyModeToggle";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
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
        <ElderlyModeToggle />
      </header>

      <main className="flex-1 pb-20">{children}</main>

      <BottomNav />
      <CookieConsent />
    </div>
  );
}
