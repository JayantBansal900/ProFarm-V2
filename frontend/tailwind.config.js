
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        profarm: {
          cream: "#F7F6F2",
          ivory: "#FDFCF9",
          forest: "#18392B",
          deep: "#10291F",
          olive: "#71805D",
          sage: "#A7B69A",
          mist: "#E9EDE6",
          gold: "#C9A66B",
          ink: "#1D2520",
          muted: "#69736B",
          border: "#E5E9E2",
        },

        brand: {
          50: "#F3F7F1",
          100: "#E5EDE1",
          200: "#CADCC4",
          300: "#A7C49E",
          400: "#7FA875",
          500: "#5B8A56",
          600: "#426E42",
          700: "#315638",
          800: "#24442F",
          900: "#18392B",
          950: "#10291F",
        },
      },

      fontFamily: {
        sans: ["Manrope", "Inter", "sans-serif"],
        display: ["Manrope", "sans-serif"],
        editorial: ["Instrument Serif", "Georgia", "serif"],
      },

      fontSize: {
        "hero": [
          "clamp(3.5rem, 7vw, 7rem)",
          {
            lineHeight: "0.98",
            letterSpacing: "-0.065em",
            fontWeight: "500",
          },
        ],

        "display": [
          "clamp(2.75rem, 5vw, 5rem)",
          {
            lineHeight: "1.05",
            letterSpacing: "-0.055em",
            fontWeight: "500",
          },
        ],

        "section": [
          "clamp(2rem, 3.5vw, 3.5rem)",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.045em",
            fontWeight: "500",
          },
        ],
      },

      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
        "4xl": "2.25rem",
        "pill": "9999px",
      },

      boxShadow: {
        soft: "0 8px 30px rgba(16, 41, 31, 0.06)",
        card: "0 12px 40px rgba(16, 41, 31, 0.08)",
        elevated: "0 24px 70px rgba(16, 41, 31, 0.14)",
        glow: "0 0 40px rgba(113, 128, 93, 0.14)",
      },

      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        350: "350ms",
        450: "450ms",
        600: "600ms",
        800: "800ms",
      },

      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },

        fadeUp: {
          from: {
            opacity: "0",
            transform: "translateY(24px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        scaleIn: {
          from: {
            opacity: "0",
            transform: "scale(0.96)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },

        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-8px)",
          },
        },

        shimmer: {
          "0%": {
            backgroundPosition: "-200% 0",
          },
          "100%": {
            backgroundPosition: "200% 0",
          },
        },
      },

      animation: {
        "fade-in": "fadeIn 600ms ease-out both",
        "fade-up": "fadeUp 800ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scaleIn 600ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },

      backgroundImage: {
        "forest-gradient":
          "linear-gradient(135deg, #18392B 0%, #10291F 100%)",

        "cream-gradient":
          "linear-gradient(180deg, #FDFCF9 0%, #F7F6F2 100%)",

        "hero-overlay":
          "linear-gradient(90deg, rgba(16,41,31,0.55) 0%, rgba(16,41,31,0.08) 100%)",
      },

      maxWidth: {
        content: "1440px",
        wide: "1600px",
      },
    },
  },

  plugins: [],
};
