import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { useWebRedirect } from "@/hooks/use-web-redirect";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

const FEATURES = [
  "Unlimited AI food lookups",
  "Unlimited AI goal coaching",
  "Image-based food recognition",
  "Priority support",
];

export default function PaywallScreen() {
  const redirecting = useWebRedirect();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (redirecting) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Ionicons
        name="trophy"
        size={56}
        color={colors.primary}
        style={styles.icon}
      />
      <Text style={styles.title}>Unlock Pro</Text>
      <Text style={styles.subtitle}>Get the most out of Snap Cals</Text>

      <View style={styles.featureList}>
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.success}
            />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={styles.badge}>
        <Ionicons
          name="phone-portrait-outline"
          size={24}
          color={colors.textSecondary}
        />
        <Text style={styles.badgeTitle}>Coming Soon on Web</Text>
        <Text style={styles.badgeText}>
          Subscriptions are available on the mobile app. Web payments coming in
          a future update.
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: {
      alignItems: "center",
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    icon: { marginBottom: spacing.md },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    featureList: { width: "100%", marginTop: spacing.lg, gap: spacing.md },
    featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    featureText: {
      fontSize: fontSize.md,
      color: colors.text,
      fontWeight: fontWeight.medium,
    },
    badge: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginTop: spacing.lg,
      width: "100%",
    },
    badgeTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginTop: spacing.sm,
    },
    badgeText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: spacing.xs,
    },
  });
