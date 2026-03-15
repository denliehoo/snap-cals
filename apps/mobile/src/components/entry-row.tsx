import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../theme";
import type { FoodEntry } from "@snap-cals/shared";

interface Props {
  entry: FoodEntry;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function EntryRow({ entry, onPress, onLongPress }: Props) {
  const { name, servingSize, calories, protein, carbs, fat } = entry;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>{servingSize}</Text>
      </View>
      <View style={styles.macros}>
        <Text style={styles.cals}>{calories} kcal</Text>
        <Text style={styles.meta}>
          P {protein}g · C {carbs}g · F {fat}g
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, marginRight: spacing.sm },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  macros: { alignItems: "flex-end" },
  cals: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.calorieColor },
});
