export interface DisplayPrefs {
  largeText: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

export const DISPLAY_PREFS_KEY = "mdf-display-prefs";

export const DEFAULT_DISPLAY_PREFS: DisplayPrefs = {
  largeText: false,
  reduceMotion: false,
  highContrast: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getDisplayPrefs(): DisplayPrefs {
  if (!isBrowser()) return { ...DEFAULT_DISPLAY_PREFS };
  try {
    const raw = localStorage.getItem(DISPLAY_PREFS_KEY);
    if (!raw) return { ...DEFAULT_DISPLAY_PREFS };
    const parsed = JSON.parse(raw) as Partial<DisplayPrefs>;
    return {
      largeText: Boolean(parsed.largeText),
      reduceMotion: Boolean(parsed.reduceMotion),
      highContrast: Boolean(parsed.highContrast),
    };
  } catch {
    return { ...DEFAULT_DISPLAY_PREFS };
  }
}

export function setDisplayPrefs(prefs: DisplayPrefs): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // quota / private mode — ignore, prefs stay in-memory
  }
  applyDisplayPrefs(prefs);
}

export function applyDisplayPrefs(prefs: DisplayPrefs): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("large-text", prefs.largeText);
  // keep legacy alias used by older CSS
  root.classList.toggle("elderly", prefs.largeText);
  root.classList.toggle("reduce-motion", prefs.reduceMotion);
  root.classList.toggle("high-contrast", prefs.highContrast);
}
