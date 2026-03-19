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
  } = useAuthForm("login", (msg) => show(msg, "error"));
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

        <View style={styles.buttonWrapper}>
          <Button title="Log In" onPress={submit} loading={loading} />
        </View>

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
    buttonWrapper: { marginTop: spacing.sm, marginBottom: spacing.lg },
    link: {
      color: colors.primary,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      textAlign: "center",
    },
  });
