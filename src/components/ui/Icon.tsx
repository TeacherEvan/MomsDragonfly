import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type IconName =
  | "compass"
  | "wallet"
  | "bell"
  | "ticket"
  | "camera"
  | "sparkle"
  | "close"
  | "chevron-right"
  | "settings"
  | "map-pin"
  | "calendar"
  | "trash"
  | "search"
  | "refresh"
  | "check"
  | "alert"
  | "restaurant"
  | "toilet"
  | "pharmacy"
  | "landmark"
  | "theater"
  | "tree"
  | "star";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  title?: string;
}

const glyphs: Record<IconName, ReactNode> = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.9 8.1-2.05 5.85-5.85 2.05 2.05-5.85z" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M21 10.5h-3.75a2.25 2.25 0 0 0 0 4.5H21" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
      <path d="M13.7 20.5a2 2 0 0 1-3.4 0" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v1a2.5 2.5 0 0 0 0 5v1A2.5 2.5 0 0 1 17.5 18h-11A2.5 2.5 0 0 1 4 15.5v-1a2.5 2.5 0 0 0 0-5z" />
      <path d="M15 9v2M15 13v2" />
    </>
  ),
  camera: (
    <>
      <path d="M2.5 9A2.5 2.5 0 0 1 5 6.5h2.6a1 1 0 0 0 .87-.5l1-1.7a1 1 0 0 1 .86-.5h3.34a1 1 0 0 1 .86.5l1 1.7a1 1 0 0 0 .87.5H19A2.5 2.5 0 0 1 21.5 9v8A2.5 2.5 0 0 1 19 19.5H5A2.5 2.5 0 0 1 2.5 17z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 3.5 12.4 8 16.9 9.4 12.4 10.8 11 15.3 9.6 10.8 5.1 9.4 9.6 8z" />
      <path d="m17.5 14.5.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />
      <path d="m20.5 3.8.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M19.5 10.2c0 5.2-7.5 11.6-7.5 11.6S4.5 15.4 4.5 10.2a7.5 7.5 0 0 1 15 0z" />
      <circle cx="12" cy="10.2" r="2.75" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l.75 12A2 2 0 0 0 9.25 21h5.5a2 2 0 0 0 2-1.95L17.5 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.6-4.6" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 4v6h-6" />
      <path d="M3 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L21 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L3 14" />
    </>
  ),
  check: <path d="M20 6.5 9.5 17 4.5 12" />,
  alert: (
    <>
      <path d="M10.29 3.86 2.6 18a2 2 0 0 0 1.74 3h15.32a2 2 0 0 0 1.74-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9.5v4" />
      <path d="M12 17.5h.01" />
    </>
  ),
  restaurant: (
    <>
      <path d="M6.5 3v4.5a3 3 0 0 0 6 0V3" />
      <path d="M9.5 3v3.2" />
      <path d="M9.5 10.5V21" />
      <path d="M15.5 3c1.6 1.4 2.5 3.7 2.5 6.5 0 1.7-1 2.9-2.5 3.2-1.5-.3-2.5-1.5-2.5-3.2 0-2.8.9-5.1 2.5-6.5z" />
      <path d="M15.5 12.7V21" />
    </>
  ),
  toilet: (
    <>
      <path d="M7.5 3h9A1.5 1.5 0 0 1 18 4.5V8H6V4.5A1.5 1.5 0 0 1 7.5 3z" />
      <path d="M5 8h14" />
      <path d="M6.8 8l.8 6.2a2.5 2.5 0 0 0 2.5 2.2h3.8a2.5 2.5 0 0 0 2.5-2.2L17.2 8" />
      <path d="M10 16.4V20h4v-3.6" />
    </>
  ),
  pharmacy: (
    <>
      <path d="M3.5 10.5h17" />
      <path d="M4.2 10.5v1.4a7.8 4.6 0 0 0 15.6 0v-1.4" />
      <path d="M12.8 9.8 17.8 4" />
      <circle cx="18.8" cy="3.6" r="1.6" />
    </>
  ),
  landmark: (
    <>
      <path d="M2.5 9.25 12 4l9.5 5.25z" />
      <path d="M6 9.5V17M12 9.5V17M18 9.5V17" />
      <path d="M3.5 17.25h17M5.5 20.5h13" />
    </>
  ),
  theater: (
    <>
      <path d="M4.5 8A2.5 2.5 0 0 1 7 5.5h10A2.5 2.5 0 0 1 19.5 8v.5a7.5 7.5 0 0 1-15 0z" />
      <circle cx="9.5" cy="9" r="1.3" />
      <circle cx="14.5" cy="9" r="1.3" />
      <path d="M9 13.2c.8 1.1 1.8 1.7 3 1.7s2.2-.6 3-1.7" />
    </>
  ),
  tree: (
    <>
      <path d="M12 3.5c-3.1 0-5.4 2.1-5.4 4.8 0 .5.1 1 .3 1.5a3.7 3.7 0 0 0 1.7 6.8h6.8a3.7 3.7 0 0 0 1.7-6.8c.2-.5.3-1 .3-1.5 0-2.7-2.3-4.8-5.4-4.8z" />
      <path d="M12 16.6V21" />
      <path d="M8.5 21h7" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.65 5.62 5.85.94-4.25 4.24 1.02 6.2L12 17.6l-5.27 2.9 1.02-6.2L3.5 10.06l5.85-.94z" />
  ),
};

export function Icon({ name, size = 24, className, strokeWidth = 1.75, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title>{title}</title> : null}
      {glyphs[name]}
    </svg>
  );
}