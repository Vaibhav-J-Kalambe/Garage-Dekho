"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ThemeCtx = createContext({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("gd_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = stored ?? (prefersDark ? "dark" : "light");
    setTheme(resolved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("gd_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
