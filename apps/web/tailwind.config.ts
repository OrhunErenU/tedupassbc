import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" }
    },
    extend: {
      colors: {
        tedu: {
          DEFAULT: "#C8102E",
          50: "#FDECEF",
          100: "#FACED6",
          200: "#F39FAE",
          500: "#C8102E",
          600: "#A60D26",
          700: "#820A1E"
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        console: { DEFAULT: "hsl(var(--console))", foreground: "hsl(var(--console-foreground))" },
        // Soft tinted accent surfaces — bring warmth/color to cards & sections
        // without promoting any of them to a CTA color (red stays the action color).
        tint: {
          rose: "#FCE9EC",
          peach: "#FDEFE4",
          butter: "#FBF3D9",
          mint: "#E6F5EE",
          sky: "#E7F1FB",
          lavender: "#F1EAFB"
        },
        role: {
          organizer: "#C8102E",
          speaker: "#E08A1E",
          mentor: "#7C3AED",
          volunteer: "#0F9D6B",
          attendee: "#2563EB"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both"
      }
    }
  },
  plugins: [animate]
};

export default config;
