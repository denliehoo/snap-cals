import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { spacing, fontSize, borderRadius, fontWeight } from "../theme";
import { useColors } from "../contexts/theme-context";

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
  const colors = useColors();

  const bgMap = { primary: colors.primary, danger: colors.error, "text-danger": "transparent" };
  const textMap = { primary: colors.textOnPrimary, danger: colors.textOnPrimary, "text-danger": colors.error };

  return (
    <TouchableOpacity
      style={[styles.base, { backgroundColor: bgMap[variant] }, disabled && styles.disabled]}
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
  disabled: { opacity: 0.5 },
});
