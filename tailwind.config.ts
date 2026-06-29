import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2D6A4F",
          dark: "#1B4332",
          light: "#D8F3DC",
        },
        secondary: {
          DEFAULT: "#74C69D",
          dark: "#52B788",
        },
        success: {
          DEFAULT: "#40916C",
          light: "#D8F3DC",
        },
        warning: {
          DEFAULT: "#F4A261",
          light: "#FFF3E0",
        },
        error: {
          DEFAULT: "#E63946",
          light: "#FEE2E2",
        },
        neutral: {
          900: "#1A1A2E",
          700: "#374151",
          500: "#6B7280",
          300: "#D1D5DB",
          100: "#F9FAF8",
          50: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "0.25rem",
        md: "0.75rem",
        lg: "1rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        elevated: "0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
}

export default config
