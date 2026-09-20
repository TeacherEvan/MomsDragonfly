"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";

const tabs = [
  { href: "/explore", label: "Explore", icon: "🗺️", testId: "explore" },
  { href: "/budget", label: "Budget", icon: "💰", testId: "budget" },
  { href: "/reminders", label: "Reminders", icon: "🔔", testId: "reminders" },
  { href: "/tickets", label: "Tickets", icon: "🎟️", testId: "tickets" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-dragonfly-navy-900/95 backdrop-blur-sm border-t border-dragonfly-navy-800 z-40 shadow-strong"
      aria-label="Main navigation"
    >
      <ul className="flex justify-around items-center h-16">
        {tabs.map(({ href, label, icon, testId }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 relative">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 text-caption transition-colors duration-fast",
                  "min-h-[var(--touch-target)] w-full",
                  isActive
                    ? "text-dragonfly-teal-400 font-semibold"
                    : "text-dragonfly-navy-400 hover:text-dragonfly-navy-200"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <div
                    data-testid={`nav-dragonfly-${testId}`}
                    className="absolute top-1 left-1/2 -translate-x-1/2 pointer-events-none"
                  >
                    <DragonflySilhouette size="sm" animated={true} decorative />
                  </div>
                )}
                <span className="text-xl mb-0.5" aria-hidden="true">
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}