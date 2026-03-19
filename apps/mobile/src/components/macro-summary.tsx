import type { Goal } from "@snap-cals/shared";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import type { DailyTotals } from "@/screens/daily-view/use-daily-entries";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  totals: DailyTotals;
  goals?: Goal | null;
}

const MACRO_KEYS: {
  key: keyof DailyTotals;
  goalKey: keyof Goal;
  label: string;
  colorKey: "calorieColor" | "proteinColor" | "carbsColor" | "fatColor";
  suffix: string;
}[] = [
  {
    key: "calories",
    goalKey: "dailyCalories",
    label: "kcal",
    colorKey: "calorieColor",
    suffix: "",
  },
  {
    key: "protein",
    goalKey: "dailyProtein",
    label: "protein",
    colorKey: "proteinColor",
    suffix: "g",
  },
  {
    key: "carbs",
    goalKey: "dailyCarbs",
    label: "carbs",
    colorKey: "carbsColor",
    suffix: "g",
  },
  {
    key: "fat",
    goalKey: "dailyFat",
    label: "fat",
    colorKey: "fatColor",
    suffix: "g",
  },
];

export default function MacroSummary({ totals, goals }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      {MACRO_KEYS.map(({ key, goalKey, label, colorKey, suffix }) => {
        const current = totals[key];
        const goal = goals ? (goals[goalKey] as number) : null;
        const over = goal != null && current > goal;
        const color = colors[colorKey];
        const pct = goal ? Math.min(current / goal, 1) : 0;

        return (
          <View key={key} style={styles.item}>
            <Text
              style={[styles.value, { color: over ? colors.error : color }]}
            >
              {current}
              {suffix}
            </Text>
            {goal != null && (
              <>
                <Text style={[styles.goal, { color: colors.textSecondary }]}>
                  / {goal}
                  {suffix}
                </Text>
                <View
                  style={[styles.trackBg, { backgroundColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.trackFill,
                      {
                        width: `${pct * 100}%`,
                        backgroundColor: over ? colors.error : color,
                      },
                    ]}
                  />
                </View>
              </>
            )}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {label}
            </Text>
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
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
  },
  item: { alignItems: "center", flex: 1 },
  value: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  goal: { fontSize: fontSize.xs },
  trackBg: {
    width: "80%",
    height: 4,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  trackFill: { height: "100%", borderRadius: borderRadius.full },
  label: { fontSize: fontSize.xs, marginTop: 2 },
});
