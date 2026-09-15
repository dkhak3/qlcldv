import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { DEFAULT_TET_THEME_SETTINGS, saveTetThemeSettings, subscribeTetThemeSettings } from "./services/tetThemeService";
import { getCanChiYear, getVietnameseZodiac, normalizeTetYear } from "./utils/tet";

const TetThemeContext = createContext(null);
const STORAGE_KEY = "qlcldv-tet-theme";

function getCachedSettings() {
  try {
    const cached = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!cached) return DEFAULT_TET_THEME_SETTINGS;
    return {
      enabled: Boolean(cached.enabled),
      year: normalizeTetYear(cached.year, DEFAULT_TET_THEME_SETTINGS.year),
    };
  } catch {
    return DEFAULT_TET_THEME_SETTINGS;
  }
}

export function TetThemeProvider({ children }) {
  const auth = useAuth();
  const [settings, setSettings] = useState(getCachedSettings);
  const [loading, setLoading] = useState(Boolean(auth.user));

  useEffect(() => {
    if (!auth.user) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const unsubscribe = subscribeTetThemeSettings(
      next => {
        setSettings(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [auth.user?.uid]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("tet-theme", settings.enabled);
    if (settings.enabled) {
      root.dataset.tetYear = String(settings.year);
      root.dataset.tetAnimal = getVietnameseZodiac(settings.year).branch;
    } else {
      delete root.dataset.tetYear;
      delete root.dataset.tetAnimal;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo(() => {
    const zodiac = getVietnameseZodiac(settings.year);
    return {
      ...settings,
      loading,
      zodiac,
      canChi: getCanChiYear(settings.year),
      refreshLocal: next => setSettings({ enabled: Boolean(next.enabled), year: normalizeTetYear(next.year, settings.year) }),
      save: async next => {
        const saved = await saveTetThemeSettings(next);
        setSettings(saved);
        return saved;
      },
    };
  }, [loading, settings]);

  return <TetThemeContext.Provider value={value}>{children}</TetThemeContext.Provider>;
}

export function useTetTheme() {
  const context = useContext(TetThemeContext);
  if (!context) throw new Error("useTetTheme phải nằm trong TetThemeProvider");
  return context;
}
