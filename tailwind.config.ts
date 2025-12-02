import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"]
      },
      colors: {
        accent: {
          DEFAULT: "#4f46e5", // indigo-ish
          soft: "#818cf8"
        }
      },
      backgroundImage: {
        "gradient-radial":
          "radial-gradient(circle at top, rgba(79,70,229,0.35), transparent 60%)",
        "gradient-orbit":
          "radial-gradient(circle at 0% 0%, rgba(236,72,153,0.25), transparent 60%), radial-gradient(circle at 100% 100%, rgba(56,189,248,0.25), transparent 60%)"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15,23,42,0.45)",
        neon: "0 0 25px rgba(129,140,248,0.85)"
      },
      backdropBlur: {
        xs: "2px"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "soft-pulse": "soft-pulse 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

