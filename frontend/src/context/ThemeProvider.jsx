import React, { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContextCore";

const THEME_VALUES = ["dark", "light", "ocean", "rose"];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("library-theme") || localStorage.getItem("libra_theme");
    return THEME_VALUES.includes(savedTheme) ? savedTheme : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("library-theme", theme);
    localStorage.setItem("libra_theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}