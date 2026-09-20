import { dragonflyPalette } from "./dragonfly";

export const iridescentCSS = {
  '--iridescent-1': `linear-gradient(135deg, ${dragonflyPalette.cyan[500]} 0%, ${dragonflyPalette.teal[500]} 50%, ${dragonflyPalette.emerald[500]} 100%)`,
  '--iridescent-2': `linear-gradient(45deg, ${dragonflyPalette.cyan[400]} 0%, ${dragonflyPalette.cyan[500]} 30%, ${dragonflyPalette.teal[500]} 70%, ${dragonflyPalette.emerald[500]} 100%)`,
  '--iridescent-shift': `linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)`,
  '--gold-shimmer': `linear-gradient(90deg, ${dragonflyPalette.gold[500]} 0%, ${dragonflyPalette.gold[400]} 50%, ${dragonflyPalette.gold[500]} 100%)`,
} as const;

export const dragonflyCSSVariables = {
  '--color-bg': dragonflyPalette.navy[950],
  '--color-surface': dragonflyPalette.navy[900],
  '--color-surface-elevated': dragonflyPalette.navy[800],
  '--color-primary': dragonflyPalette.teal[500],
  '--color-primary-hover': dragonflyPalette.teal[600],
  '--color-accent': dragonflyPalette.cyan[500],
  '--color-gold': dragonflyPalette.gold[500],
  '--color-text': dragonflyPalette.navy[50],
  '--color-text-muted': dragonflyPalette.navy[400],
  '--color-border': dragonflyPalette.navy[800],
} as const;