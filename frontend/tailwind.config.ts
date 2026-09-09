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
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        "bg-primary": "#0f172a",
        "bg-secondary": "#1e293b",
        "accent-cyan": "#22d3ee",
        "accent-green": "#4ade80",
        "damage-none": "#22c55e",
        "damage-minor": "#eab308",
        "damage-major": "#f97316",
        "damage-destroyed": "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-fira-code)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
