import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { colors, darkColors } from "@/theme";
import { getItem, setItem } from "@/utils/storage";

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
    getItem(STORAGE_KEY).then((stored) => {
      if (stored === "light") setIsDark(false);
      setRestored(true);
    });
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      setItem(STORAGE_KEY, next ? "dark" : "light");
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
