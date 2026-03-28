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
        // ── Stitch Design System Tokens ──────────────────────────────────────
        // Primary action & brand
        "primary":                    "#0056b7",
        "primary-container":          "#006de6",
        "on-primary":                 "#ffffff",
        "on-primary-container":       "#f7f7ff",
        "primary-fixed":              "#d8e2ff",
        "primary-fixed-dim":          "#adc6ff",
        "on-primary-fixed":           "#001a41",
        "on-primary-fixed-variant":   "#004493",
        "inverse-primary":            "#adc6ff",
        "surface-tint":               "#005bc1",

        // Secondary (violet-indigo — premium features)
        "secondary":                  "#4c4aca",
        "on-secondary":               "#ffffff",
        "secondary-container":        "#6664e4",
        "on-secondary-container":     "#fffbff",
        "secondary-fixed":            "#e2dfff",
        "secondary-fixed-dim":        "#c2c1ff",
        "on-secondary-fixed":         "#0c006a",
        "on-secondary-fixed-variant": "#3631b4",

        // Tertiary (warm red — alerts, warnings)
        "tertiary":                   "#a33200",
        "on-tertiary":                "#ffffff",
        "tertiary-container":         "#cc4204",
        "on-tertiary-container":      "#fff6f4",
        "tertiary-fixed":             "#ffdbd0",
        "tertiary-fixed-dim":         "#ffb59d",
        "on-tertiary-fixed":          "#390c00",
        "on-tertiary-fixed-variant":  "#832600",

        // Surfaces — layered depth system (no borders, depth via bg shifts)
        "background":                 "#f9f9fe",
        "surface":                    "#f9f9fe",
        "surface-bright":             "#f9f9fe",
        "surface-dim":                "#d9dade",
        "surface-container-lowest":   "#ffffff",   // Cards, interactive elements
        "surface-container-low":      "#f3f3f8",   // Section backgrounds
        "surface-container":          "#ededf2",   // Subtle containers
        "surface-container-high":     "#e8e8ed",   // Raised containers
        "surface-container-highest":  "#e2e2e7",   // Highest elevation
        "surface-variant":            "#e2e2e7",
        "inverse-surface":            "#2e3034",
        "inverse-on-surface":         "#f0f0f5",

        // Text
        "on-surface":                 "#1a1c1f",   // Primary text (not pure black)
        "on-surface-variant":         "#424656",   // Secondary / metadata text
        "on-background":              "#1a1c1f",

        // Outline
        "outline":                    "#727687",
        "outline-variant":            "#c2c6d8",   // Ghost borders (use at 10-15% opacity)

        // Error / Emergency
        "error":                      "#ba1a1a",
        "on-error":                   "#ffffff",
        "error-container":            "#ffdad6",
        "on-error-container":         "#93000a",

        // ── Legacy aliases (kept for backward compat) ────────────────────────
        "accent":                     "#0056b7",   // Now same as primary
        "accent-light":               "#d8e2ff",   // primary-fixed
        "card":                       "#ffffff",   // surface-container-lowest
        "border":                     "#c2c6d8",   // outline-variant
        "muted":                      "#424656",   // on-surface-variant
        "brandOrange":                "#FF6B00",
      },
      borderRadius: {
        "DEFAULT": "0.5rem",   // 8px — minimum per design system
        "lg":      "0.75rem",  // 12px
        "xl":      "1rem",     // 16px
        "2xl":     "1.25rem",  // 20px
        "3xl":     "1.5rem",   // 24px
        "full":    "9999px",
      },
      boxShadow: {
        // Ambient shadows — diffuse, tinted (per design system)
        "card":       "0 4px 24px rgba(0, 86, 183, 0.04)",
        "card-hover": "0 8px 32px rgba(0, 86, 183, 0.08)",
        "nav":        "0 -4px 24px rgba(0, 0, 0, 0.04)",
        "modal":      "0 8px 64px rgba(0, 86, 183, 0.12)",
        "primary":    "0 4px 16px rgba(0, 86, 183, 0.30)",
        "sos":        "0 6px 24px rgba(186, 26, 26, 0.32)",
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
