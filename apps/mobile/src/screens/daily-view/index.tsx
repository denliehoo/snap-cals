import React, { useMemo } from "react";
import { View, Text, SectionList, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, fontSize, fontWeight } from "../../theme";
import { useColors } from "../../contexts/theme-context";
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
  const colors = useColors();
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

  const styles = useMemo(() => makeStyles(colors), [colors]);

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
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>Tap + to log your first meal</Text>
            </View>
          }
        />
      )}

      <Fab onPress={() => navigation.navigate("EntryForm")} />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
    },
    sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
    sectionCals: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textSecondary },
    listContent: { paddingBottom: 80 },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyWrap: { alignItems: "center" },
    emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, marginTop: spacing.md },
    emptyText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
    loader: { flex: 1, justifyContent: "center" },
  });
