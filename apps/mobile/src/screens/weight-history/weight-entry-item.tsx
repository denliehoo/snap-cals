import { Ionicons } from "@expo/vector-icons";
import type { WeightEntry } from "@snap-cals/shared";
import { useRef } from "react";
import { type Animated, StyleSheet, Text, View } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { useColors } from "@/contexts/theme-context";
import { fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  entry: WeightEntry;
  weightUnit: string;
  onPress: () => void;
  onDelete: () => void;
}

export default function WeightEntryItem({
  entry,
  weightUnit,
  onPress,
  onDelete,
}: Props) {
  const colors = useColors();
  const swipeRef = useRef<Swipeable>(null);

  const displayWeight = weightUnit === "kg" ? entry.weightKg : entry.weightLbs;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => (
    <View style={[styles.swipeAction, { backgroundColor: colors.error }]}>
      <Ionicons name="trash" size={24} color={colors.textOnPrimary} />
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={() => onDelete()}
    >
      <RectButton
        style={[styles.entryRow, { backgroundColor: colors.surface }]}
        onPress={onPress}
      >
        <View style={styles.entryLeft}>
          <Text style={[styles.entryWeight, { color: colors.text }]}>
            {displayWeight} {weightUnit}
          </Text>
          <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
            {formatDate(entry.loggedAt)}
          </Text>
          {entry.note ? (
            <Text style={[styles.entryNote, { color: colors.textSecondary }]}>
              {entry.note}
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
}

const styles = StyleSheet.create({
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E0",
  },
  entryLeft: { flex: 1 },
  entryWeight: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  entryDate: { fontSize: fontSize.sm },
  entryNote: { fontSize: fontSize.xs, fontStyle: "italic", marginTop: 2 },
  swipeAction: { justifyContent: "center", alignItems: "center", width: 80 },
});
