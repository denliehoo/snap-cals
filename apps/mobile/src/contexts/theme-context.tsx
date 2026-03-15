import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

type ThemeMode = "system" | "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  isDark: false,
  setMode: () => {},
});

const STORAGE_KEY = "theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setModeState(stored);
      }
      setRestored(true);
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    SecureStore.setItemAsync(STORAGE_KEY, newMode);
  }, []);

  const isDark =
    mode === "dark" ? true : mode === "light" ? false : systemScheme === "dark";

  if (!restored) return null;

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
