import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SubscriptionTier } from "@snap-cals/shared";
import type React from "react";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Purchases from "react-native-purchases";
import ThemedSwitch from "@/components/themed-switch";
import { useColors, useTheme } from "@/contexts/theme-context";
import type { MainStackParamList } from "@/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useUsageStore } from "@/stores/usage.store";
import { fontSize, fontWeight, spacing } from "@/theme";

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
  right?: React.ReactNode;
};

function SettingsRow({ icon, label, onPress, color, right }: RowProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tint = color ?? colors.text;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={22} color={tint} style={styles.rowIcon} />
      <Text style={[styles.rowLabel, { color: tint }]}>{label}</Text>
      {right !== undefined ? (
        right
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const { logout } = useAuthStore();
  const { discussionMode, toggleDiscussionMode } = useSettingsStore();
  const { used, limit, tier } = useUsageStore();
  const { isDark, toggle } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isPro = tier === SubscriptionTier.PRO;

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingsRow
          icon={isDark ? "moon" : "sunny-outline"}
          label="Dark Mode"
          right={<ThemedSwitch value={isDark} onValueChange={toggle} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI</Text>
        <SettingsRow
          icon="chatbubbles-outline"
          label="Discussion Mode"
          right={
            <ThemedSwitch
              value={discussionMode}
              onValueChange={toggleDiscussionMode}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <SettingsRow
          icon={isPro ? "trophy" : "person-outline"}
          label={isPro ? "Plan: Pro" : "Plan: Free"}
          right={null}
        />
        {isPro ? (
          <SettingsRow
            icon="settings-outline"
            label="Manage Subscription"
            onPress={() => Purchases.showManageSubscriptions()}
          />
        ) : (
          <>
            <SettingsRow
              icon="sparkles-outline"
              label={`AI Lookups Today: ${used} / ${limit}`}
              right={null}
            />
            <SettingsRow
              icon="arrow-up-circle-outline"
              label="Upgrade to Pro"
              onPress={() => navigation.navigate("Paywall")}
            />
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsRow
          icon="log-out-outline"
          label="Logout"
          onPress={logout}
          color={colors.error}
          right={null}
        />
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: spacing.md,
    },
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
