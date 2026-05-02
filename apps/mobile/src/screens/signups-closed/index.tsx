import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "@/components/button";
import { useColors } from "@/contexts/theme-context";
import type { AuthStackParamList } from "@/navigation";
import { borderRadius, fontSize, fontWeight, shadow, spacing } from "@/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "SignupsClosed">;

export default function SignupsClosedScreen({ navigation }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🚧</Text>
        <Text style={styles.title}>Not Accepting New Accounts</Text>
        <Text style={styles.body}>
          We're not accepting new sign-ups at the moment. Please check back
          later.
        </Text>
        <View style={styles.buttonWrapper}>
          <Button
            title="Go to Login"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      </View>
    </View>
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
      alignItems: "center",
      ...shadow.md,
    },
    emoji: {
      fontSize: 48,
      marginBottom: spacing.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    body: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    buttonWrapper: {
      width: "100%",
    },
  });
