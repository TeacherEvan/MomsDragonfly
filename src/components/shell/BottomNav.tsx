"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { DragonflySilhouette } from "@/components/ui/DragonflySilhouette";
import { Icon, type IconName } from "@/components/ui/Icon";

const tabs: ReadonlyArray<{ href: string; label: string; icon: IconName }> = [
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/budget", label: "Budget", icon: "wallet" },
  { href: "/reminders", label: "Reminders", icon: "bell" },
  { href: "/tickets", label: "Tickets", icon: "ticket" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeIndex = tabs.findIndex((t) => pathname.startsWith(t.href));
  const x = useMotionValue(activeIndex >= 0 ? activeIndex * 25 : 0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });

  const handleTabClick = (index: number) => {
    x.set(index * 25);
    router.push(tabs[index].href);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-dragonfly-navy-900/95 backdrop-blur-sm border-t border-dragonfly-navy-800 z-40 shadow-strong"
      aria-label="Main navigation"
    >
      <div className="relative h-16">
        {/* Flying dragonfly indicator */}
        <motion.div
          style={{ x: springX }}
          className="absolute top-1 left-[25%] -translate-x-1/2 pointer-events-none transition-all duration-500 ease-out"
        >
          <DragonflySilhouette size="sm" animated={true} decorative />
        </motion.div>

        <ul className="flex justify-around items-center h-full">
          {tabs.map(({ href, label, icon }, index) => {
            const isActive = pathname.startsWith(href);
            return (
              <li key={href} className="flex-1 relative">
                <motion.div
                  onClick={() => handleTabClick(index)}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 text-caption transition-colors duration-fast",
                    "min-h-[var(--touch-target)] w-full",
                    isActive
                      ? "text-dragonfly-gold-500 font-semibold"
                      : "text-dragonfly-navy-400 hover:text-dragonfly-navy-200"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  whileTap={{ scale: 0.95 }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleTabClick(index); }}
                >
                  <span className="mb-0.5 relative z-10">
                    <Icon name={icon} size={22} strokeWidth={isActive ? 2.1 : 1.75} />
                  </span>
                  <span className="relative z-10">{label}</span>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
