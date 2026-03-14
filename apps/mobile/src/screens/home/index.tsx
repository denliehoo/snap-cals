import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../../theme";
import Button from "../../components/button";
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

      <View style={styles.buttonWrapper}>
        <Button title="+ Add Food Entry" onPress={() => navigation.navigate("EntryForm")} />
      </View>
      <Button title="Log Out" onPress={logout} variant="text-danger" />
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
  buttonWrapper: { marginBottom: spacing.sm },
});
