export const dragonflyPalette = {
  teal: {
    50: "#e6fffa", 100: "#b2f5ea", 200: "#81e6d9", 300: "#4fd1c5",
    400: "#38b2ac", 500: "#319795", 600: "#2c7a7b", 700: "#285e61",
    800: "#234e52", 900: "#1d3f43", 950: "#0f2628"
  },
  cyan: {
    50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9",
    400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490",
    800: "#155e75", 900: "#164e63", 950: "#083344"
  },
  emerald: {
    50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7",
    400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857",
    800: "#065f46", 900: "#064e3b", 950: "#022c22"
  },
  gold: {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
    400: "#fbbf24", 500: "#D4AF37", 600: "#b8941f", 700: "#927414",
    800: "#785c12", 900: "#634a14", 950: "#3b2a0a"
  },
  navy: {
    50: "#f0f4f8", 100: "#d9e2ec", 200: "#bcccdc", 300: "#9fb3c8",
    400: "#829ab1", 500: "#627d98", 600: "#486581", 700: "#334e68",
    800: "#243b53", 900: "#102a43", 950: "#061416"
  },
  rose: {
    50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af",
    400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c",
    800: "#9f1239", 900: "#881337", 950: "#4c0519"
  },
  amber: {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
    400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
    800: "#92400e", 900: "#78350f", 950: "#451a03"
  },
  orange: {
    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74",
    400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c",
    800: "#9a3412", 900: "#7c2d12", 950: "#431407"
  }
} as const;

export type DragonflyColor = keyof typeof dragonflyPalette;
export type DragonflyShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export function getIridescentGradient(angle: number = 135): string {
  return `linear-gradient(${angle}deg, ${dragonflyPalette.cyan[400]} 0%, ${dragonflyPalette.teal[500]} 42%, ${dragonflyPalette.orange[400]} 100%)`;
}

export function getSunsetGradient(angle: number = 135): string {
  return `linear-gradient(${angle}deg, ${dragonflyPalette.orange[400]} 0%, ${dragonflyPalette.orange[500]} 55%, ${dragonflyPalette.amber[500]} 100%)`;
}

export function getGoldShimmer(): string {
  return `linear-gradient(90deg, ${dragonflyPalette.gold[500]} 0%, ${dragonflyPalette.orange[400]} 50%, ${dragonflyPalette.gold[500]} 100%)`;
}

export const dragonflyTokens = {
  bg: dragonflyPalette.navy[950],
  surface: dragonflyPalette.navy[900],
  surfaceElevated: dragonflyPalette.navy[800],
  primary: dragonflyPalette.teal[500],
  primaryHover: dragonflyPalette.teal[600],
  accent: dragonflyPalette.cyan[500],
  gold: dragonflyPalette.gold[500],
  accentOrange: dragonflyPalette.orange[500],
  accentOrangeSoft: dragonflyPalette.orange[400],
  text: dragonflyPalette.navy[50],
  textMuted: dragonflyPalette.navy[400],
  border: dragonflyPalette.navy[800]
};