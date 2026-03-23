import { Ionicons } from "@expo/vector-icons";
import { FREE_DAILY_AI_LIMIT } from "@snap-cals/shared";
import { useMemo } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";
import AppModal from "./app-modal";
import Button from "./button";

interface Props {
  visible: boolean;
  onClose: () => void;
  resetsAt: string;
}

export default function UsageLimitModal({ visible, onClose, resetsAt }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const resetTime = resetsAt
    ? new Date(resetsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "midnight UTC";

  return (
    <AppModal visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.primary} />
        <Text style={styles.title}>Daily AI Limit Reached</Text>
        <Text style={styles.message}>
          You've used all {FREE_DAILY_AI_LIMIT} AI lookups today
        </Text>
        <Text style={styles.reset}>Resets at {resetTime}</Text>
        <View style={styles.buttons}>
          <Button
            title="Upgrade to Pro"
            onPress={() =>
              Alert.alert("Coming Soon", "Pro subscriptions will be available soon.")
            }
          />
          <Button title="Close" variant="text" onPress={onClose} />
        </View>
      </View>
    </AppModal>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    content: { alignItems: "center", padding: spacing.lg },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginTop: spacing.md,
    },
    message: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    reset: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    buttons: {
      width: "100%",
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
  });
