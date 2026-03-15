import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../theme";
import DateNavigator from "../../components/date-navigator";
import { useWeeklyEntries, DaySummary } from "./use-weekly-entries";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<MainStackParamList, "WeeklyView">;

export default function WeeklyViewScreen({ navigation }: Props) {
  const { days, goals, weekLabel, loading, refreshing, onRefresh, goToPreviousWeek, goToNextWeek } =
    useWeeklyEntries();

  const goalCalories = goals?.dailyCalories ?? 2000;

  const renderDay = ({ item }: { item: DaySummary }) => {
    const { date, label, calories, protein, carbs, fat, entryCount } = item;
    const isToday = date === new Date().toISOString().split("T")[0];
    const over = calories > goalCalories;

    return (
      <TouchableOpacity
        style={[styles.dayCard, isToday && styles.todayCard]}
        onPress={() => navigation.navigate("DailyView")}
      >
        <View style={styles.dayHeader}>
          <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{label}</Text>
          <Text style={styles.entryCount}>{entryCount} {entryCount === 1 ? "entry" : "entries"}</Text>
        </View>
        <Text style={[styles.dayCals, over && styles.overGoal]}>
          {calories} <Text style={styles.goalText}>/ {goalCalories} kcal</Text>
        </Text>
        <Text style={styles.dayMacros}>
          P {protein}g · C {carbs}g · F {fat}g
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <DateNavigator label={weekLabel} onPrevious={goToPreviousWeek} onNext={goToNextWeek} />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.date}
          renderItem={renderDay}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayCard: { borderColor: colors.primary, borderWidth: 2 },
  dayHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
  dayLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  todayLabel: { color: colors.primary },
  entryCount: { fontSize: fontSize.xs, color: colors.textSecondary },
  dayCals: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.calorieColor },
  overGoal: { color: colors.error },
  goalText: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: colors.textSecondary },
  dayMacros: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  loader: { flex: 1, justifyContent: "center" },
});
