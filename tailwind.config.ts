import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#D4AF37",
          600: "#b8941f",
          700: "#927414",
          800: "#785c12",
          900: "#634a14",
        },
        accent: {
          50: "#f5f0ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#6A4C93",
          600: "#5b3db8",
          700: "#4c2d9e",
          800: "#3d247e",
          900: "#311d63",
        },
        surface: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0A0F2C",
        },
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#111111",
        },
        dragonfly: {
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
          },
        },
      },
      fontSize: {
        h1: ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h2: ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h3: ["1.75rem", { lineHeight: "1.3" }],
        body: ["1rem", { lineHeight: "1.6" }],
        caption: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.5" }],
      },
      spacing: {
        0: "0",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "24px",
        6: "32px",
        8: "48px",
        10: "64px",
        12: "96px",
        16: "128px",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
        full: "9999px",
      },
      minHeight: {
        touch: "44px",
        "touch-lg": "56px",
      },
      minWidth: {
        touch: "44px",
        "touch-lg": "56px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        soft: "0 2px 8px 0 rgb(0 0 0 / 0.08)",
        medium: "0 4px 16px 0 rgb(0 0 0 / 0.1)",
        strong: "0 8px 32px 0 rgb(0 0 0 / 0.12)",
        glow: "0 0 20px rgb(212 175 55 / 0.3)",
        "glow-orange": "0 0 24px rgb(249 115 22 / 0.35)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "350ms",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(0.4, 0, 0.2, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        float: 'dragonfly-float 4s ease-in-out infinite',
        'wing-shimmer': 'wing-shimmer 2s ease-in-out infinite',
        'iridescent-shift': 'iridescent-shift 3s ease-in-out infinite',
      },
      backgroundImage: {
        'iridescent': 'var(--iridescent-1)',
        'iridescent-2': 'var(--iridescent-2)',
        'gold-shimmer': 'var(--gold-shimmer)',
      },
    },
  },
  plugins: [],
};

export default config;
