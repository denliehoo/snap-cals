import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { colors, spacing, fontSize, borderRadius, fontWeight } from "../theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "danger" | "text-danger";
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
  return (
    <TouchableOpacity
      style={[styles.base, variantStyles[variant]]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color={variant === "text-danger" ? colors.error : colors.textOnPrimary} />
      ) : (
        <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.error },
  "text-danger": { backgroundColor: "transparent" },
});

const textStyles = StyleSheet.create({
  primary: { color: colors.textOnPrimary },
  danger: { color: colors.textOnPrimary },
  "text-danger": { color: colors.error },
});
