import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

type SnackbarType = "success" | "error";

interface SnackbarContextValue {
  show: (message: string, type?: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({ show: () => {} });

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SnackbarType>("success");
  const opacity = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (msg: string, t: SnackbarType = "success") => {
      if (timeout.current) clearTimeout(timeout.current);
      setMessage(msg);
      setType(t);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      timeout.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 3000);
    },
    [opacity],
  );

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          {
            opacity,
            backgroundColor: type === "error" ? colors.error : colors.success,
          },
        ]}
      >
        <Text style={[styles.text, { color: colors.textOnPrimary }]}>
          {message}
        </Text>
      </Animated.View>
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => useContext(SnackbarContext);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 80,
    left: spacing.xl,
    right: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  text: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
});
