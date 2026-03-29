import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WeightEntry } from "@snap-cals/shared";
import { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  type Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { MainStackParamList, MainTabParamList } from "@/navigation";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";
import { useWeightHistory } from "./use-weight-history";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "WeightTab">,
  NativeStackScreenProps<MainStackParamList>
>;

const RANGES = ["7d", "30d", "90d", "all"] as const;
const screenWidth = Dimensions.get("window").width;

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
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const handleDelete = (entry: WeightEntry) => {
    Alert.alert("Delete Weight Entry", "Delete this entry?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => swipeableRefs.current.get(entry.id)?.close(),
      },
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

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => (
    <View style={[styles.swipeAction, { backgroundColor: colors.error }]}>
      <Ionicons name="trash" size={24} color={colors.textOnPrimary} />
    </View>
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const renderItem = ({ item }: { item: WeightEntry }) => {
    const displayWeight = weightUnit === "kg" ? item.weightKg : item.weightLbs;
    return (
      <Swipeable
        ref={(ref) => {
          if (ref) swipeableRefs.current.set(item.id, ref);
        }}
        renderRightActions={renderRightActions}
        onSwipeableOpen={() => handleDelete(item)}
      >
        <RectButton
          style={[styles.entryRow, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate("WeightLog", { entry: item })}
        >
          <View style={styles.entryLeft}>
            <Text style={[styles.entryWeight, { color: colors.text }]}>
              {displayWeight} {weightUnit}
            </Text>
            <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
              {formatDate(item.loggedAt)}
            </Text>
            {item.note ? (
              <Text style={[styles.entryNote, { color: colors.textSecondary }]}>
                {item.note}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </RectButton>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Range toggle */}
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
        <LineChart
          data={{
            labels: chartData
              .filter((_, i) => {
                const step = Math.max(1, Math.floor(chartData.length / 5));
                return i % step === 0 || i === chartData.length - 1;
              })
              .map((d) =>
                d.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
              ),
            datasets: [{ data: chartData.map((d) => d.value) }],
          }}
          width={screenWidth - spacing.md * 2}
          height={200}
          yAxisSuffix={` ${weightUnit}`}
          chartConfig={{
            backgroundColor: colors.surface,
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 1,
            color: () => colors.primary,
            labelColor: () => colors.textSecondary,
            propsForDots: { r: "4", fill: colors.primary },
          }}
          bezier
          style={styles.chart}
        />
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
        renderItem={renderItem}
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
    chart: { borderRadius: borderRadius.md, alignSelf: "center" },
    loader: { marginVertical: spacing.xl },
    emptyChart: {
      height: 120,
      justifyContent: "center",
      alignItems: "center",
    },
    entryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    entryLeft: { flex: 1 },
    entryWeight: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    entryDate: { fontSize: fontSize.sm },
    entryNote: {
      fontSize: fontSize.xs,
      fontStyle: "italic",
      marginTop: 2,
    },
    swipeAction: {
      justifyContent: "center",
      alignItems: "center",
      width: 80,
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
