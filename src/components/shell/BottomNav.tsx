"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/explore", label: "Explore", icon: "🗺️" },
  { href: "/budget", label: "Budget", icon: "💰" },
  { href: "/reminders", label: "Reminders", icon: "🔔" },
  { href: "/tickets", label: "Tickets", icon: "🎟️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-surface-900/95 backdrop-blur-sm border-t border-neutral-800 z-40 shadow-strong"
      aria-label="Main navigation"
    >
      <ul className="flex justify-around items-center h-16">
        {tabs.map(({ href, label, icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 text-caption transition-colors duration-fast",
                  "min-h-[var(--touch-target)] w-full",
                  isActive
                    ? "text-primary-500 font-semibold"
                    : "text-neutral-400 hover:text-neutral-50"
                )}
                aria-current={isActive ? "page" : undefined}
              >
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
