/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        secondary: "#8B5CF6",
        accent: "#F97316",
        background: "#0B1120",
        surface: "rgba(15, 23, 42, 0.7)",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card:
          "0 20px 45px -20px rgba(15,23,42,0.45), 0 12px 24px -10px rgba(99,102,241,0.25)",
        glow: "0 0 0 1px rgba(99,102,241,0.5), 0 25px 50px -12px rgba(15, 23, 42, 0.65)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

