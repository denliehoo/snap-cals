import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

interface Props {
  onPress: () => void;
  label?: string;
}

export default function Fab({ onPress, label = "+" }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: colors.textOnPrimary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  text: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
});
