import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth.store";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../theme";

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  right?: React.ReactNode;
};

function SettingsRow({ icon, label, onPress, color = colors.text, right }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {right ?? <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsRow icon="log-out-outline" label="Logout" onPress={logout} color={colors.error} right={null} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: { marginRight: spacing.md },
  rowLabel: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium },
});
