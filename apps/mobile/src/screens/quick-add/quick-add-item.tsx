import { Ionicons } from "@expo/vector-icons";
import type { FavoriteFoodItem, RecentFoodItem } from "@snap-cals/shared";
import { useRef } from "react";
import { type Animated, StyleSheet, Text, View } from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";

type QuickAddItem = FavoriteFoodItem | RecentFoodItem;

interface Props {
  item: QuickAddItem;
  isFavorite: boolean;
  onPress: () => void;
  onFavorite?: () => void;
  onRemove?: () => void;
}

export default function QuickAddItem({
  item,
  isFavorite,
  onPress,
  onFavorite,
  onRemove,
}: Props) {
  const colors = useColors();
  const swipeRef = useRef<Swipeable>(null);

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => (
    <View style={[styles.swipeAction, { backgroundColor: colors.success }]}>
      <Ionicons name="heart" size={24} color={colors.textOnPrimary} />
    </View>
  );

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    _drag: Animated.AnimatedInterpolation<number>,
  ) => (
    <View
      style={[
        styles.swipeAction,
        styles.swipeRight,
        { backgroundColor: colors.error },
      ]}
    >
      <Ionicons name="trash" size={24} color={colors.textOnPrimary} />
    </View>
  );

  const card = (
    <RectButton
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
    >
      <View style={styles.top}>
        <View style={styles.nameCol}>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
          {"source" in item && item.source ? (
            <Text style={[styles.source, { color: colors.textSecondary }]}>
              {item.source}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.cals, { color: colors.calorieColor }]}>
          {item.calories} kcal
        </Text>
      </View>
      <View style={styles.macroRow}>
        <Text style={[styles.macro, { color: colors.proteinColor }]}>
          P {item.protein}g
        </Text>
        <Text style={[styles.macro, { color: colors.carbsColor }]}>
          C {item.carbs}g
        </Text>
        <Text style={[styles.macro, { color: colors.fatColor }]}>
          F {item.fat}g
        </Text>
      </View>
    </RectButton>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderLeftActions={isFavorite ? undefined : renderLeftActions}
      renderRightActions={isFavorite ? renderRightActions : undefined}
      onSwipeableOpen={(direction) => {
        if (direction === "left" && !isFavorite) {
          onFavorite?.();
          swipeRef.current?.close();
        }
        if (direction === "right" && isFavorite) onRemove?.();
      }}
    >
      {card}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    ...shadow.sm,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameCol: { flex: 1, marginRight: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  source: { fontSize: fontSize.xs, marginTop: 2 },
  cals: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  macroRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  macro: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  swipeAction: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  swipeRight: { alignItems: "flex-start" },
});
