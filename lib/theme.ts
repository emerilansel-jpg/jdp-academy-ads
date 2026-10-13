export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "pesat_theme_preference";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  // Default to light as requested by user
  return "light";
}

export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
