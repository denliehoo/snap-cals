import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WeightEntry } from "@snap-cals/shared";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { MainStackParamList, MainTabParamList } from "@/navigation";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";
import { showAlert } from "@/utils/alert";
import { useWeightHistory } from "./use-weight-history";
import WeightChart from "./weight-chart";
import WeightEntryItem from "./weight-entry-item";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "WeightTab">,
  NativeStackScreenProps<MainStackParamList>
>;

const RANGES = ["7d", "30d", "90d", "all"] as const;

export default function WeightHistoryScreen({ navigation }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const {
    entries,
    chartData,
    range,
    setRange,
    loading,
    deleteEntry,
    weightUnit,
  } = useWeightHistory();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleDelete = (entry: WeightEntry) => {
    showAlert("Delete Weight Entry", "Delete this entry?", [
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

  return (
    <View style={styles.container}>
      <View style={styles.rangeRow}>
        {RANGES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeChip, range === r && styles.rangeChipActive]}
            onPress={() => setRange(r)}
          >
            <Text
              style={[styles.rangeText, range === r && styles.rangeTextActive]}
            >
              {r === "all" ? "All" : r.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      ) : chartData.length >= 2 ? (
        <WeightChart data={chartData} weightUnit={weightUnit} />
      ) : (
        <View style={styles.emptyChart}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {entries.length === 0
              ? "No weight entries yet"
              : "Need at least 2 entries for a chart"}
          </Text>
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WeightEntryItem
            entry={item}
            weightUnit={weightUnit}
            onPress={() => navigation.navigate("WeightLog", { entry: item })}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={
          entries.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="scale-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No entries
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Log your weight from the Daily view
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    rangeRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    rangeChip: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    rangeChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    rangeText: { fontSize: fontSize.sm, color: colors.textSecondary },
    rangeTextActive: {
      color: colors.textOnPrimary,
      fontWeight: fontWeight.medium,
    },
    loader: { marginVertical: spacing.xl },
    emptyChart: {
      height: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    listContent: { paddingBottom: 80 },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    emptyWrap: { alignItems: "center", marginTop: spacing.xl },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      marginTop: spacing.md,
    },
    emptyText: { fontSize: fontSize.sm, marginTop: spacing.xs },
  });
