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
        // Orbital night palette
        ink: "#060B1C",
        deep: "#0C1530",
        line: "#22305C",
        paper: "#E8ECF6",
        haze: "#8E9AC0",
        faint: "#5D6A91",
        signal: "#A5B8FF",

        // Joint Damage Scale (kept in sync with DAMAGE_COLORS in lib/types.ts)
        "damage-none": "#22c55e",
        "damage-minor": "#eab308",
        "damage-major": "#f97316",
        "damage-destroyed": "#ef4444",

        // Legacy tokens kept so nothing that still references them breaks
        background: "var(--ink)",
        foreground: "var(--paper)",
        "bg-primary": "#060B1C",
        "bg-secondary": "#0C1530",
        "accent-cyan": "#A5B8FF",
        "accent-green": "#22c55e",
      },
      fontFamily: {
        sans: ["'Archivo Variable'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // 1.25 modular scale
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        frame: "28px",
      },
      keyframes: {
        "pulse-travel": {
          "0%": { transform: "translateX(-10%)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateX(1010%)", opacity: "0" },
        },
        "blink-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "pulse-travel": "pulse-travel 3.6s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "blink-soft": "blink-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
