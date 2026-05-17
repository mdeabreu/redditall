"use client";

import { useEffect, useState } from "react";
import { getThemePreference, setThemePreference, type ThemePreference } from "@/lib/storage";

type ResolvedTheme = "light" | "dark";

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export function useThemePreference() {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const storedPreference = getThemePreference();
    setThemePreferenceState(storedPreference);
    setResolvedTheme(applyResolvedTheme(storedPreference));
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DARK_SCHEME_QUERY);

    function handleSystemThemeChange() {
      if (themePreference === "system") {
        setResolvedTheme(applyResolvedTheme("system"));
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [themePreference]);

  function updateThemePreference(nextPreference: ThemePreference) {
    const storedPreference = setThemePreference(nextPreference);
    setThemePreferenceState(storedPreference);
    setResolvedTheme(applyResolvedTheme(storedPreference));
  }

  return {
    themePreference,
    resolvedTheme,
    setThemePreference: updateThemePreference,
  };
}

function applyResolvedTheme(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference);
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return window.matchMedia(DARK_SCHEME_QUERY).matches ? "dark" : "light";
}
