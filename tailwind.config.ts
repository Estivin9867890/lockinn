import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: "#5B9CF6",
          mint: "#34D399",
          rose: "#F472B6",
          orange: "#FB923C",
          purple: "#A78BFA",
          yellow: "#FBBF24",
          red: "#F87171",
          indigo: "#818CF8",
        },
        glass: {
          white: "rgba(255, 255, 255, 0.7)",
          dark: "rgba(0, 0, 0, 0.06)",
          border: "rgba(255, 255, 255, 0.5)",
        },
        surface: {
          DEFAULT: "#F5F5F7",
          card: "rgba(255, 255, 255, 0.75)",
          sidebar: "rgba(245, 245, 247, 0.85)",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
        "3xl": "60px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.6)",
        "glass-sm": "0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
        "glass-lg": "0 20px 60px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.7)",
        card: "0 2px 20px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.12)",
        ring: "0 0 0 3px rgba(91, 156, 246, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "scale-in": "scaleIn 0.3s ease-out",
        spin: "spin 1s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "ring-fill": "ringFill 1.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        ringFill: {
          "0%": { "stroke-dashoffset": "283" },
          "100%": { "stroke-dashoffset": "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
