import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "text" | "text-secondary" | "text-danger";
  loading?: boolean;
  disabled?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
}: ButtonProps) {
  const colors = useColors();

  const bgMap = {
    primary: colors.primary,
    danger: colors.error,
    text: "transparent",
    "text-secondary": "transparent",
    "text-danger": "transparent",
  };
  const textMap = {
    primary: colors.textOnPrimary,
    danger: colors.textOnPrimary,
    text: colors.primary,
    "text-secondary": colors.textSecondary,
    "text-danger": colors.error,
  };
  const isText =
    variant === "text" ||
    variant === "text-secondary" ||
    variant === "text-danger";

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bgMap[variant] },
        isText && styles.textVariant,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textMap[variant]} />
      ) : (
        <Text style={[styles.text, { color: textMap[variant] }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  text: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  textVariant: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  disabled: { opacity: 0.5 },
});
