import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "@/components/button";
import FormField from "@/components/form-field";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { AuthStackParamList } from "@/navigation";
import { api } from "@/services/api";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";
import { getErrorMessage } from "@/utils/error";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ route, navigation }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const [email, setEmail] = useState(route.params?.email ?? "");
  const [loading, setLoading] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const submit = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      navigation.navigate("ResetPassword", { email: email.trim().toLowerCase() });
    } catch (e: unknown) {
      show(getErrorMessage(e, "Failed to send reset code"), "error");
    } finally {
      setLoading(false);
    }
  }, [email, navigation, show]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset code
        </Text>

        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
        />

        <View style={styles.buttonWrapper}>
          <Button title="Send Reset Code" onPress={submit} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    buttonWrapper: { marginTop: spacing.sm },
    link: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      textAlign: "center",
      marginTop: spacing.lg,
    },
  });
