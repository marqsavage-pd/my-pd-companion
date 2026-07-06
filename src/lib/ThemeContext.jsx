import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ theme: "system", setTheme: () => {} });

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getStoredTheme() {
  try { return localStorage.getItem("pd-theme") || "system"; } catch { return "system"; }
}

function applyTheme(theme) {
  const isDark = theme === "dark" || (theme === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem("pd-theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (t) => setThemeState(t);
  const cycle = () => setThemeState(prev => prev === "light" ? "dark" : prev === "dark" ? "system" : "light");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);