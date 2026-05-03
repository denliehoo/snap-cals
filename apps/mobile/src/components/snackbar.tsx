import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";

type SnackbarType = "success" | "error";

interface SnackbarAction {
  label: string;
  onPress: () => void;
}

interface ShowOptions {
  action?: SnackbarAction;
  duration?: number;
}

interface SnackbarContextValue {
  show: (message: string, type?: SnackbarType, options?: ShowOptions) => void;
}

const SnackbarContext = createContext<SnackbarContextValue>({ show: () => {} });

const ICON: Record<SnackbarType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
};

const DEFAULT_DURATION = 3000;

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<SnackbarType>("success");
  const [action, setAction] = useState<SnackbarAction | undefined>();
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const dismiss = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  }, [translateY, opacity]);

  const show = useCallback(
    (msg: string, t: SnackbarType = "success", options?: ShowOptions) => {
      if (timeout.current) clearTimeout(timeout.current);
      setMessage(msg);
      setType(t);
      setAction(options?.action);
      setVisible(true);
      translateY.setValue(-100);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 120,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      const duration = options?.duration ?? DEFAULT_DURATION;
      timeout.current = setTimeout(dismiss, duration);
    },
    [translateY, opacity, dismiss],
  );

  const bg = type === "error" ? colors.error : colors.success;

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.container,
            shadow.md,
            { backgroundColor: bg, opacity, transform: [{ translateY }] },
          ]}
        >
          <Pressable style={styles.content} onPress={dismiss}>
            <Ionicons
              name={ICON[type]}
              size={20}
              color={colors.textOnPrimary}
            />
            <Text style={[styles.text, { color: colors.textOnPrimary }]}>
              {message}
            </Text>
            {action && (
              <Pressable
                onPress={() => {
                  action.onPress();
                  dismiss();
                }}
                style={styles.actionButton}
              >
                <Text
                  style={[styles.actionText, { color: colors.textOnPrimary }]}
                >
                  {action.label}
                </Text>
              </Pressable>
            )}
            <View style={styles.closeHit}>
              <Ionicons name="close" size={18} color={colors.textOnPrimary} />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => useContext(SnackbarContext);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  closeHit: {
    padding: spacing.xs,
  },
});
