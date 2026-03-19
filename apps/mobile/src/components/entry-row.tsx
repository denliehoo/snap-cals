import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, fontSize, fontWeight, borderRadius, shadow } from "@/theme";
import { useColors } from "@/contexts/theme-context";
import type { FoodEntry } from "@snap-cals/shared";

interface Props {
  entry: FoodEntry;
  onPress: () => void;
  onLongPress?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function EntryRow({ entry, onPress, onLongPress, isFavorite, onToggleFavorite }: Props) {
  const colors = useColors();
  const { name, servingSize, calories, protein, carbs, fat } = entry;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          {servingSize ? <Text style={[styles.meta, { color: colors.textSecondary }]}>{servingSize}</Text> : null}
        </View>
        <View style={styles.topRight}>
          {onToggleFavorite && (
            <TouchableOpacity onPress={onToggleFavorite} hitSlop={8} testID="favorite-toggle">
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? colors.error : colors.textSecondary} />
            </TouchableOpacity>
          )}
          <Text style={[styles.cals, { color: colors.calorieColor }]}>{calories} kcal</Text>
        </View>
      </View>
      <View style={styles.macroRow}>
        <Text style={[styles.macroPill, { color: colors.proteinColor }]}>P {protein}g</Text>
        <Text style={[styles.macroPill, { color: colors.carbsColor }]}>C {carbs}g</Text>
        <Text style={[styles.macroPill, { color: colors.fatColor }]}>F {fat}g</Text>
      </View>
    </TouchableOpacity>
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
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  info: { flex: 1, marginRight: spacing.sm },
  topRight: { alignItems: "flex-end", gap: spacing.xs },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  meta: { fontSize: fontSize.xs, marginTop: 2 },
  cals: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  macroRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  macroPill: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
});
