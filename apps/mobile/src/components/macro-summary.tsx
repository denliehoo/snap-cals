import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../theme";
import type { DailyTotals } from "../screens/daily-view/use-daily-entries";

interface Props {
  totals: DailyTotals;
}

const MACROS: { key: keyof DailyTotals; label: string; color: string; suffix: string }[] = [
  { key: "calories", label: "kcal", color: colors.calorieColor, suffix: "" },
  { key: "protein", label: "protein", color: colors.proteinColor, suffix: "g" },
  { key: "carbs", label: "carbs", color: colors.carbsColor, suffix: "g" },
  { key: "fat", label: "fat", color: colors.fatColor, suffix: "g" },
];

export default function MacroSummary({ totals }: Props) {
  return (
    <View style={styles.bar}>
      {MACROS.map(({ key, label, color, suffix }) => (
        <View key={key} style={styles.item}>
          <Text style={[styles.value, { color }]}>{totals[key]}{suffix}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  item: { alignItems: "center" },
  value: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
