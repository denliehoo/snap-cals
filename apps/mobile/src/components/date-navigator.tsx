import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  onLabelPress?: () => void;
}

export default function DateNavigator({
  label,
  onPrevious,
  onNext,
  onLabelPress,
}: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <TouchableOpacity onPress={onPrevious} style={styles.arrow} hitSlop={8}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onLabelPress} disabled={!onLabelPress}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNext} style={styles.arrow} hitSlop={8}>
        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  arrow: { paddingHorizontal: spacing.lg },
  label: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    minWidth: 140,
    textAlign: "center",
  },
});
