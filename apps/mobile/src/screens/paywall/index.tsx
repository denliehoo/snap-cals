import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SubscriptionTier } from "@snap-cals/shared";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import Button from "@/components/button";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { MainStackParamList } from "@/navigation";
import { useUsageStore } from "@/stores/usage.store";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";

const FEATURES = [
  "Unlimited AI food lookups",
  "Unlimited AI goal coaching",
  "Image-based food recognition",
  "Priority support",
];

type Status = "loading" | "ready" | "error" | "purchasing" | "restoring";

export default function PaywallScreen() {
  const colors = useColors();
  const { show } = useSnackbar();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { setTier, fetch: fetchUsage } = useUsageStore();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    Purchases.getOfferings()
      .then((offerings) => {
        const monthly = offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null;
        setPkg(monthly);
        setStatus(monthly ? "ready" : "error");
      })
      .catch(() => setStatus("error"));
  }, []);

  const handleSubscribe = async () => {
    if (!pkg) return;
    setStatus("purchasing");
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active.pro) {
        setTier(SubscriptionTier.PRO);
        fetchUsage();
        show("Welcome to Pro! 🎉");
        navigation.goBack();
      } else {
        setStatus("ready");
      }
    } catch (e: unknown) {
      const isCancelled = e instanceof Object && "userCancelled" in e && (e as { userCancelled: boolean }).userCancelled;
      if (!isCancelled) show("Purchase failed. Please try again.", "error");
      setStatus("ready");
    }
  };

  const handleRestore = async () => {
    setStatus("restoring");
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active.pro) {
        setTier(SubscriptionTier.PRO);
        fetchUsage();
        show("Subscription restored! 🎉");
        navigation.goBack();
      } else {
        show("No active subscription found", "error");
        setStatus("ready");
      }
    } catch {
      show("Restore failed. Please try again.", "error");
      setStatus("ready");
    }
  };

  if (status === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === "error" && !pkg) {
    return (
      <View style={styles.centered}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.errorText}>Subscriptions not available right now</Text>
        <View style={styles.retryButton}>
          <Button title="Try Again" onPress={() => { setStatus("loading"); Purchases.getOfferings().then((o) => { setPkg(o.current?.monthly ?? o.current?.availablePackages[0] ?? null); setStatus(o.current ? "ready" : "error"); }).catch(() => setStatus("error")); }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Ionicons name="trophy" size={56} color={colors.primary} style={styles.icon} />
      <Text style={styles.title}>Unlock Pro</Text>
      <Text style={styles.subtitle}>Get the most out of Snap Cals</Text>

      <View style={styles.featureList}>
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Monthly</Text>
        <Text style={styles.price}>{pkg?.product.priceString ?? "$4.99"}</Text>
        <Text style={styles.pricePer}>per month</Text>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Subscribe"
          onPress={handleSubscribe}
          loading={status === "purchasing"}
          disabled={status === "restoring"}
        />
        <Button
          title="Restore Purchases"
          variant="text"
          onPress={handleRestore}
          loading={status === "restoring"}
          disabled={status === "purchasing"}
        />
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { alignItems: "center", padding: spacing.lg, paddingTop: spacing.xl },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background, padding: spacing.lg },
    icon: { marginBottom: spacing.md },
    title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
    subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
    featureList: { width: "100%", marginTop: spacing.lg, gap: spacing.md },
    featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    featureText: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
    priceCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginTop: spacing.lg,
      width: "100%",
    },
    priceLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.semibold, textTransform: "uppercase", letterSpacing: 1 },
    price: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary, marginTop: spacing.xs },
    pricePer: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
    buttons: { width: "100%", marginTop: spacing.lg, gap: spacing.xs },
    errorText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.md, textAlign: "center" },
    retryButton: { marginTop: spacing.md, width: "60%" },
  });
