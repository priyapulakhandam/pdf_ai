import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#03060f",
        surface: "#080f1e",
        card: "#0d1729",
        cyan: {
          DEFAULT: "#00d4ff",
          glow: "rgba(0,212,255,0.15)",
        },
        accent: {
          blue: "#3b82f6",
        },
        success: "#10b981",
        warning: "#f59e0b",
        "amber-accent": "#f59e0b",
        error: "#ef4444",
        ink: {
          primary: "#f0f6ff",
          secondary: "#7a90b0",
          muted: "#3d5068",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      letterSpacing: {
        display: "-0.03em",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0,212,255,0.2)",
        "glow-lg": "0 0 40px rgba(0,212,255,0.25)",
        "glow-intense": "0 0 28px rgba(0,212,255,0.45)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.06)",
        lift: "0 16px 48px rgba(0,0,0,0.5)",
        sidebar: "4px 0 24px rgba(0,0,0,0.35)",
      },
      backgroundImage: {
        "ambient-orbs":
          "radial-gradient(ellipse 50% 40% at 85% 8%, rgba(0,212,255,0.08) 0%, transparent 55%), radial-gradient(ellipse 40% 35% at 10% 90%, rgba(59,130,246,0.06) 0%, transparent 50%), radial-gradient(ellipse 35% 30% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 45%)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
      },
      animation: {
        "orb-drift": "orb-drift 22s ease-in-out infinite alternate",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "dash-trace": "dash-trace 3s linear infinite",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "pulse-badge": "pulse-badge 1.8s ease-in-out infinite",
        cursor: "cursor-blink 1s step-end infinite",
        "fade-cursor": "fade-cursor 0.6s ease forwards",
      },
      keyframes: {
        "orb-drift": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(1.5%, -1.5%) scale(1.04)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "dash-trace": {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-1000" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "pulse-badge": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        "cursor-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "fade-cursor": {
          to: { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
