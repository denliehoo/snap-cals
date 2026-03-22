import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
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
import { useAuthForm } from "@/hooks/use-auth-form";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import type { AuthStackParamList } from "@/navigation";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
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
    "login",
    (msg) => show(msg, "error"),
    (userId) => navigation.navigate("VerifyEmail", { userId }),
  );
  const google = useGoogleAuth((msg) => show(msg, "error"));
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>🔥 Snap Cals</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>

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
        />

        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPassword", { email })}
        >
          <Text style={styles.forgotLink}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.buttonWrapper}>
          <Button title="Log In" onPress={submit} loading={loading} />
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

        <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
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
    forgotLink: {
      color: colors.primary,
      fontSize: fontSize.sm,
      textAlign: "right",
      marginTop: spacing.xs,
    },
    buttonWrapper: { marginTop: spacing.md, marginBottom: spacing.md },
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
