
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
          cream: "#F1F5F3",
          ivory: "#FFFFFF",
          forest: "#0F5257",
          deep: "#0A3B3F",
          olive: "#2C7F72",
          sage: "#9CC5B6",
          mist: "#E3EEEA",
          gold: "#E9A400",
          turmeric: "#E9A400",
          soil: "#7A4E2D",
          paddy: "#3E8E41",
          ink: "#14262E",
          muted: "#56676B",
          border: "#D5E0DD",
        },

        brand: {
          50: "#EEF6F4",
          100: "#D9ECE7",
          200: "#B3D8CE",
          300: "#84BDAF",
          400: "#4F9C8C",
          500: "#2C7F72",
          600: "#1C6A63",
          700: "#15585A",
          800: "#0F5257",
          900: "#0A3B3F",
          950: "#072B2E",
        },
      },

      fontFamily: {
        sans: ["'Noto Sans'", "'Noto Sans Devanagari'", "'Noto Sans Gurmukhi'", "'Noto Sans Telugu'", "'Noto Sans Tamil'", "system-ui", "sans-serif"],
        display: ["'Baloo 2'", "'Baloo Paaji 2'", "'Baloo Tammudu 2'", "'Baloo Thambi 2'", "system-ui", "sans-serif"],
        serif: ["'Baloo 2'", "'Baloo Paaji 2'", "'Baloo Tammudu 2'", "'Baloo Thambi 2'", "system-ui", "sans-serif"],
        editorial: ["'Baloo 2'", "'Baloo Paaji 2'", "'Baloo Tammudu 2'", "'Baloo Thambi 2'", "system-ui", "sans-serif"],
      },

      fontSize: {
        "hero": [
          "clamp(3.5rem, 7vw, 7rem)",
          {
            lineHeight: "0.98",
            letterSpacing: "-0.02em",
            fontWeight: "700",
          },
        ],

        "display": [
          "clamp(2.75rem, 5vw, 5rem)",
          {
            lineHeight: "1.05",
            letterSpacing: "-0.015em",
            fontWeight: "700",
          },
        ],

        "section": [
          "clamp(2rem, 3.5vw, 3.5rem)",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.01em",
            fontWeight: "700",
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
        soft: "0 8px 30px rgba(10, 59, 63, 0.06)",
        card: "0 12px 40px rgba(10, 59, 63, 0.08)",
        elevated: "0 24px 70px rgba(10, 59, 63, 0.14)",
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
          "linear-gradient(135deg, #0F5257 0%, #0A3B3F 100%)",

        "cream-gradient":
          "linear-gradient(180deg, #FFFFFF 0%, #F1F5F3 100%)",

        "hero-overlay":
          "linear-gradient(90deg, rgba(10,59,63,0.55) 0%, rgba(10,59,63,0.08) 100%)",
      },

      maxWidth: {
        content: "1440px",
        wide: "1600px",
      },
    },
  },

  plugins: [],
};
