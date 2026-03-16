import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { colors, darkColors } from "@/theme";

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: true,
  toggle: () => {},
});

const STORAGE_KEY = "theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === "light") setIsDark(false);
      setRestored(true);
    });
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      SecureStore.setItemAsync(STORAGE_KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  if (!restored) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function useColors() {
  const { isDark } = useContext(ThemeContext);
  return isDark ? darkColors : colors;
}

