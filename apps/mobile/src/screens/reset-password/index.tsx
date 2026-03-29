import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "@/components/button";
import FormField from "@/components/form-field";
import KeyboardAwareView from "@/components/keyboard-aware-view";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { AuthStackParamList } from "@/navigation";
import { api } from "@/services/api";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";
import { getErrorMessage } from "@/utils/error";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const colors = useColors();
  const { show } = useSnackbar();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const submit = useCallback(async () => {
    const errors: Record<string, string> = {};
    if (!code || code.length !== 6) errors.code = "Enter the 6-digit code";
    if (!newPassword) errors.newPassword = "Password is required";
    else if (newPassword.length < 6)
      errors.newPassword = "Must be at least 6 characters";
    if (newPassword !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await api.resetPassword(email, code, newPassword);
      show("Password reset successfully", "success");
      navigation.navigate("Login");
    } catch (e: unknown) {
      show(getErrorMessage(e, "Failed to reset password"), "error");
    } finally {
      setLoading(false);
    }
  }, [code, newPassword, confirmPassword, email, navigation, show]);

  return (
    <KeyboardAwareView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

        <FormField
          label="Reset Code"
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setFieldErrors((p) => {
              const n = { ...p };
              delete n.code;
              return n;
            });
          }}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          error={fieldErrors.code}
        />
        <FormField
          label="New Password"
          value={newPassword}
          onChangeText={(v) => {
            setNewPassword(v);
            setFieldErrors((p) => {
              const n = { ...p };
              delete n.newPassword;
              return n;
            });
          }}
          placeholder="New password"
          secureTextEntry
          error={fieldErrors.newPassword}
        />
        <FormField
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={(v) => {
            setConfirmPassword(v);
            setFieldErrors((p) => {
              const n = { ...p };
              delete n.confirmPassword;
              return n;
            });
          }}
          placeholder="Confirm password"
          secureTextEntry
          error={fieldErrors.confirmPassword}
        />

        <View style={styles.buttonWrapper}>
          <Button title="Reset Password" onPress={submit} loading={loading} />
        </View>
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
    buttonWrapper: { marginTop: spacing.sm },
  });
