import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, fontSize, borderRadius, fontWeight } from "../../theme";
import { useAuthStore } from "../../stores/auth.store";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<MainStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Snap Cals</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("EntryForm")}
      >
        <Text style={styles.addButtonText}>+ Add Food Entry</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.xl },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  addButtonText: { color: colors.textOnPrimary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  logoutButton: { padding: spacing.sm },
  logoutText: { color: colors.error, fontSize: fontSize.sm },
});
