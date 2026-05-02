import { Ionicons } from "@expo/vector-icons";
import type { FavoriteFoodItem, RecentFoodItem } from "@snap-cals/shared";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";

type QuickAddItemType = FavoriteFoodItem | RecentFoodItem;

interface Props {
  item: QuickAddItemType;
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

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.top}>
          <View style={styles.nameCol}>
            <Text style={[styles.name, { color: colors.text }]}>
              {item.name}
            </Text>
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
      </TouchableOpacity>
      <View style={styles.actionRow}>
        {isFavorite ? (
          <TouchableOpacity
            onPress={onRemove}
            style={[styles.actionBtn, { backgroundColor: colors.error }]}
          >
            <Ionicons name="trash" size={16} color={colors.textOnPrimary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onFavorite}
            style={[styles.actionBtn, { backgroundColor: colors.success }]}
          >
            <Ionicons name="heart" size={16} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  actionBtn: { borderRadius: borderRadius.full, padding: spacing.xs },
});
