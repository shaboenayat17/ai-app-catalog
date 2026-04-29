import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0e1a",
          elevated: "#0f1422",
          card: "#131a2c",
          hover: "#1a2238",
        },
        border: {
          DEFAULT: "#1f2a44",
          strong: "#2a3759",
        },
        accent: {
          DEFAULT: "#7c5cff",
          hover: "#9277ff",
          glow: "rgba(124, 92, 255, 0.18)",
        },
        muted: {
          DEFAULT: "#8b95b3",
          strong: "#b4bdd8",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124, 92, 255, 0.4), 0 8px 30px rgba(124, 92, 255, 0.15)",
        lift: "0 12px 30px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(60rem 30rem at 20% -10%, rgba(124,92,255,0.25), transparent 60%), radial-gradient(50rem 30rem at 90% 0%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(40rem 25rem at 50% 100%, rgba(244,114,182,0.18), transparent 60%)",
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-32": "32px 32px",
      },
      animation: {
        "gradient-x": "gradient-x 8s ease infinite",
        "float-slow": "float 14s ease-in-out infinite",
        "float-medium": "float 10s ease-in-out infinite",
        "float-fast": "float 7s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
        "fade-in-up": "fadeInUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "slide-up": "slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scaleIn 0.18s ease-out both",
        "border-spin": "borderSpin 6s linear infinite",
        "pulse-ring": "pulseRing 1.4s ease-out 2",
        "drawer-in-right": "drawerInRight 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
        "drawer-in-bottom": "drawerInBottom 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) translateX(0)" },
          "50%": { transform: "translateY(-22px) translateX(8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        borderSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 var(--pulse-color, rgba(124,92,255,0.7))" },
          "100%": { boxShadow: "0 0 0 16px transparent" },
        },
        drawerInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0.6" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        drawerInBottom: {
          "0%": { transform: "translateY(100%)", opacity: "0.6" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
