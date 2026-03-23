import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FoodEntry } from "@snap-cals/shared";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ActionSheet from "@/components/action-sheet";
import DateNavigator from "@/components/date-navigator";
import DatePickerModal from "@/components/date-picker-modal";
import EntryRow from "@/components/entry-row";
import Fab from "@/components/fab";
import MacroSummary from "@/components/macro-summary";
import { useSnackbar } from "@/components/snackbar";
import UsageLimitModal from "@/components/usage-limit-modal";
import { useColors } from "@/contexts/theme-context";
import type { MainStackParamList, MainTabParamList } from "@/navigation";
import { useUsageStore } from "@/stores/usage.store";
import { fontSize, fontWeight, spacing } from "@/theme";
import { parseLocalDate, toLocalDateString } from "@/utils/date";
import { useDailyEntries } from "./use-daily-entries";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "DailyTab">,
  NativeStackScreenProps<MainStackParamList>
>;

export default function DailyViewScreen({ navigation, route }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const {
    date,
    setDate,
    sections,
    totals,
    goals,
    loading,
    refreshing,
    onRefresh,
    goToPreviousDay,
    goToNextDay,
    deleteEntry,
  } = useDailyEntries(route.params?.date, (msg) => show(msg, "error"));
  const [showPicker, setShowPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { isAtLimit, resetsAt, fetch: fetchUsage } = useUsageStore();

  const isToday = date === toLocalDateString();
  const dateLabel = isToday
    ? "Today"
    : parseLocalDate(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

  const handleDelete = (entry: FoodEntry) => {
    Alert.alert("Delete Entry", `Delete "${entry.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteEntry(entry.id);
          show("Entry deleted");
        },
      },
    ]);
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <DateNavigator
        label={dateLabel}
        onPrevious={goToPreviousDay}
        onNext={goToNextDay}
        onLabelPress={() => setShowPicker(true)}
      />
      <DatePickerModal
        visible={showPicker}
        value={date}
        onClose={() => setShowPicker(false)}
        onSelect={setDate}
      />
      <MacroSummary totals={totals} goals={goals} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
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
          contentContainerStyle={
            sections.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name="restaurant-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>Tap + to log your first meal</Text>
            </View>
          }
        />
      )}

      <Fab onPress={() => setShowActions(true)} />
      <ActionSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        options={[
          {
            label: "Manual Entry",
            icon: "create-outline",
            onPress: () => navigation.navigate("EntryForm"),
          },
          {
            label: "AI Assist",
            icon: "sparkles-outline",
            onPress: () => {
              if (isAtLimit()) {
                setShowLimitModal(true);
              } else {
                navigation.navigate("AiAssist");
              }
            },
          },
          {
            label: "Quick Add",
            icon: "star-outline",
            onPress: () => navigation.navigate("QuickAdd"),
          },
        ]}
      />
      <UsageLimitModal
        visible={showLimitModal}
        onClose={() => {
          setShowLimitModal(false);
          fetchUsage();
        }}
        resetsAt={resetsAt}
        onUpgrade={() => navigation.navigate("Paywall")}
      />
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
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionCals: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
    },
    listContent: { paddingBottom: 80 },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyWrap: { alignItems: "center" },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginTop: spacing.md,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    loader: { flex: 1, justifyContent: "center" },
  });
