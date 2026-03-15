import React from "react";
import { View, Text, SectionList, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../../theme";
import DateNavigator from "../../components/date-navigator";
import MacroSummary from "../../components/macro-summary";
import EntryRow from "../../components/entry-row";
import Fab from "../../components/fab";
import { useDailyEntries } from "./use-daily-entries";
import type { FoodEntry } from "@snap-cals/shared";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "DailyTab">,
  NativeStackScreenProps<MainStackParamList>
>;

export default function DailyViewScreen({ navigation, route }: Props) {
  const { date, sections, totals, goals, loading, refreshing, onRefresh, goToPreviousDay, goToNextDay, deleteEntry } =
    useDailyEntries(route.params?.date);

  const isToday = date === new Date().toISOString().split("T")[0];
  const dateLabel = isToday
    ? "Today"
    : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const handleDelete = (entry: FoodEntry) => {
    Alert.alert("Delete Entry", `Delete "${entry.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(entry.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <DateNavigator label={dateLabel} onPrevious={goToPreviousDay} onNext={goToNextDay} />
      <MacroSummary totals={totals} goals={goals} />

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EntryRow
              entry={item}
              onPress={() => navigation.navigate("EntryForm", { entry: item })}
              onLongPress={() => handleDelete(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCals}>{section.calories} kcal</Text>
            </View>
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No entries for this day.{"\n"}Tap + to add one!</Text>}
        />
      )}

      <Fab onPress={() => navigation.navigate("EntryForm")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.primaryDark },
  sectionCals: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.primaryDark },
  listContent: { paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center" },
  loader: { flex: 1, justifyContent: "center" },
});
