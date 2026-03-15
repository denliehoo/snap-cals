import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../theme";
import type { DailyTotals } from "../screens/daily-view/use-daily-entries";
import type { Goal } from "@snap-cals/shared";

interface Props {
  totals: DailyTotals;
  goals?: Goal | null;
}

const MACROS: { key: keyof DailyTotals; goalKey: keyof Goal; label: string; color: string; suffix: string }[] = [
  { key: "calories", goalKey: "dailyCalories", label: "kcal", color: colors.calorieColor, suffix: "" },
  { key: "protein", goalKey: "dailyProtein", label: "protein", color: colors.proteinColor, suffix: "g" },
  { key: "carbs", goalKey: "dailyCarbs", label: "carbs", color: colors.carbsColor, suffix: "g" },
  { key: "fat", goalKey: "dailyFat", label: "fat", color: colors.fatColor, suffix: "g" },
];

export default function MacroSummary({ totals, goals }: Props) {
  return (
    <View style={styles.bar}>
      {MACROS.map(({ key, goalKey, label, color, suffix }) => {
        const current = totals[key];
        const goal = goals ? (goals[goalKey] as number) : null;
        const over = goal != null && current > goal;

        return (
          <View key={key} style={styles.item}>
            <Text style={[styles.value, { color: over ? colors.error : color }]}>
              {current}{suffix}
            </Text>
            {goal != null && (
              <Text style={styles.goal}>/ {goal}{suffix}</Text>
            )}
            <Text style={styles.label}>{label}</Text>
          </View>
        );
      })}
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
  goal: { fontSize: fontSize.xs, color: colors.textSecondary },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
