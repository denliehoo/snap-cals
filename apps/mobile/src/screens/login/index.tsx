import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { spacing, fontSize, fontWeight, borderRadius, shadow } from "../../theme";
import { useColors } from "../../contexts/theme-context";
import FormField from "../../components/form-field";
import Button from "../../components/button";
import { useAuthForm } from "../../hooks/use-auth-form";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const colors = useColors();
  const { email, setEmail, password, setPassword, loading, error, submit } =
    useAuthForm("login");
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>🔥 Snap Cals</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FormField label="Email" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
        <FormField label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

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
    container: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: spacing.lg },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadow.md },
    title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary, textAlign: "center", marginBottom: spacing.xs },
    subtitle: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: "center", marginBottom: spacing.xl },
    error: { color: colors.error, fontSize: fontSize.sm, textAlign: "center", marginBottom: spacing.md },
    buttonWrapper: { marginTop: spacing.sm, marginBottom: spacing.lg },
    link: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium, textAlign: "center" },
  });
