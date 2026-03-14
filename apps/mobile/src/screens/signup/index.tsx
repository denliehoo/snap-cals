import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../../theme";
import FormField from "../../components/form-field";
import Button from "../../components/button";
import { useAuthForm } from "../../hooks/use-auth-form";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const { email, setEmail, password, setPassword, loading, error, submit } =
    useAuthForm("signup");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Snap Cals</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FormField label="Email" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
      <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

      <View style={styles.buttonWrapper}>
        <Button title="Sign Up" onPress={submit} loading={loading} />
      </View>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
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
  error: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  buttonWrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  link: {
    color: colors.primary,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
});
