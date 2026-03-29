import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH } from "@snap-cals/shared";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "@/components/button";
import FormField from "@/components/form-field";
import KeyboardAwareView from "@/components/keyboard-aware-view";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import { useAuthForm } from "@/hooks/use-auth-form";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import type { AuthStackParamList } from "@/navigation";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    fieldErrors,
    clearFieldError,
    submit,
  } = useAuthForm(
    "signup",
    (msg) => show(msg, "error"),
    (userId) => navigation.navigate("VerifyEmail", { userId }),
  );
  const google = useGoogleAuth((msg) => show(msg, "error"));
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <KeyboardAwareView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🔥 Snap Cals</Text>
        <Text style={styles.subtitle}>Create your account</Text>

        <FormField
          label="Email"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clearFieldError("email");
          }}
          placeholder="Email"
          keyboardType="email-address"
          error={fieldErrors.email}
          maxLength={EMAIL_MAX_LENGTH}
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            clearFieldError("password");
          }}
          placeholder="Password"
          secureTextEntry
          error={fieldErrors.password}
          maxLength={PASSWORD_MAX_LENGTH}
        />

        <View style={styles.buttonWrapper}>
          <Button title="Sign Up" onPress={submit} loading={loading} />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={google.trigger}
          disabled={!google.ready || google.loading}
        >
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Already have an account? Log in</Text>
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
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: colors.primary,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    buttonWrapper: { marginTop: spacing.sm, marginBottom: spacing.md },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
      marginHorizontal: spacing.sm,
    },
    googleButton: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    googleText: {
      color: "#333",
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
    },
    link: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      textAlign: "center",
    },
  });
