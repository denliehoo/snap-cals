import React, { useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { spacing, fontSize, fontWeight, borderRadius, shadow } from "@/theme";
import { useColors } from "@/contexts/theme-context";
import DateNavigator from "@/components/date-navigator";
import { useWeeklyEntries, DaySummary } from "./use-weekly-entries";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "@/navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "WeeklyTab">,
  NativeStackScreenProps<MainStackParamList>
>;

export default function WeeklyViewScreen({ navigation }: Props) {
  const colors = useColors();
  const { days, goals, weekLabel, loading, refreshing, onRefresh, goToPreviousWeek, goToNextWeek } =
    useWeeklyEntries();

  const goalCalories = goals?.dailyCalories ?? 2000;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const renderDay = ({ item }: { item: DaySummary }) => {
    const { date, label, calories, protein, carbs, fat, entryCount } = item;
    const isToday = date === new Date().toISOString().split("T")[0];
    const over = calories > goalCalories;
    const pct = Math.min(calories / goalCalories, 1);

    return (
      <TouchableOpacity
        style={[styles.dayCard, isToday && styles.todayCard]}
        onPress={() => navigation.navigate("DailyTab", { date })}
        activeOpacity={0.7}
      >
        <View style={styles.dayHeader}>
          <Text style={[styles.dayLabel, isToday && styles.todayLabel]}>{label}</Text>
          <Text style={styles.entryCount}>{entryCount} {entryCount === 1 ? "entry" : "entries"}</Text>
        </View>
        <Text style={[styles.dayCals, over && styles.overGoal]}>
          {calories} <Text style={styles.goalText}>/ {goalCalories} kcal</Text>
        </Text>
        <View style={styles.trackBg}>
          <View style={[styles.trackFill, { width: `${pct * 100}%`, backgroundColor: over ? colors.error : colors.primary }]} />
        </View>
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

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md },
    dayCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.sm,
    },
    todayCard: { borderColor: colors.primary, borderWidth: 2 },
    dayHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xs },
    dayLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
    todayLabel: { color: colors.primary },
    entryCount: { fontSize: fontSize.xs, color: colors.textSecondary },
    dayCals: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.calorieColor },
    overGoal: { color: colors.error },
    goalText: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: colors.textSecondary },
    trackBg: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: borderRadius.full,
      marginTop: spacing.sm,
      overflow: "hidden",
    },
    trackFill: { height: "100%", borderRadius: borderRadius.full },
    dayMacros: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm },
    loader: { flex: 1, justifyContent: "center" },
  });
