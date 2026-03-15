import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../theme";

interface Props {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export default function DateNavigator({ label, onPrevious, onNext }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPrevious} style={styles.arrow}>
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity onPress={onNext} style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  arrow: { paddingHorizontal: spacing.lg },
  arrowText: { fontSize: fontSize.xl, color: colors.primary, fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, minWidth: 140, textAlign: "center" },
});
