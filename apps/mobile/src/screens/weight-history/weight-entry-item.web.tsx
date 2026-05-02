import { Ionicons } from "@expo/vector-icons";
import type { WeightEntry } from "@snap-cals/shared";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const displayWeight = weightUnit === "kg" ? entry.weightKg : entry.weightLbs;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <TouchableOpacity
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
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
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
  deleteBtn: { padding: spacing.xs },
});
