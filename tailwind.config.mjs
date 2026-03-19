/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        primary:     "#0056D2",
        accent:      "#FF6B00",
        brandOrange: "#FF6B00",
        background:  "#F8FAFC",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
        pop: {
          "0%":   { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)"    },
        },
      },
      animation: {
        shimmer:    "shimmer 1.6s ease-in-out infinite",
        "slide-up": "slide-up 0.45s cubic-bezier(0.16,1,0.3,1) both",
        pop:        "pop 0.35s cubic-bezier(0.16,1,0.3,1) both",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
