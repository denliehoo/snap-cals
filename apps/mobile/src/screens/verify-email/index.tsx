import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "@/components/button";
import KeyboardAwareView from "@/components/keyboard-aware-view";
import FormField from "@/components/form-field";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { AuthStackParamList } from "@/navigation";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";
import { getErrorMessage } from "@/utils/error";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyEmail">;

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailScreen({ route, navigation }: Props) {
  const { userId } = route.params;
  const colors = useColors();
  const { show } = useSnackbar();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = useCallback(async () => {
    if (!code || code.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await api.verifyEmail(userId, code);
      await setAuth(data.token, data.user);
    } catch (e: unknown) {
      show(getErrorMessage(e, "Verification failed"), "error");
    } finally {
      setLoading(false);
    }
  }, [code, userId, setAuth, show]);

  const resend = useCallback(async () => {
    if (cooldown > 0) return;
    try {
      await api.resendVerification(userId);
      setCooldown(COOLDOWN_SECONDS);
      show("Verification code sent", "success");
    } catch (e: unknown) {
      show(getErrorMessage(e, "Failed to resend code"), "error");
    }
  }, [cooldown, userId, show]);

  return (
    <KeyboardAwareView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to your email
        </Text>

        <FormField
          label="Verification Code"
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
        />

        <View style={styles.buttonWrapper}>
          <Button title="Verify" onPress={submit} loading={loading} disabled={code.length !== 6} />
        </View>

        <TouchableOpacity onPress={resend} disabled={cooldown > 0}>
          <Text style={[styles.link, cooldown > 0 && styles.linkDisabled]}>
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...shadow.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    buttonWrapper: { marginTop: spacing.sm, marginBottom: spacing.lg },
    link: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      textAlign: "center",
    },
    linkDisabled: {
      color: colors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.md,
    },
  });
