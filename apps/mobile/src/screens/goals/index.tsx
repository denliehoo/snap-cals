import React, { useMemo } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { spacing, fontSize, fontWeight, borderRadius, shadow } from "../../theme";
import { useColors } from "../../contexts/theme-context";
import FormField from "../../components/form-field";
import Button from "../../components/button";
import { useGoals } from "./use-goals";
import { useSnackbar } from "../../components/snackbar";

export default function GoalsScreen() {
  const colors = useColors();
  const {
    calories, setCalories,
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    loading, saving, error, save,
  } = useGoals();
  const { show } = useSnackbar();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="flag-outline" size={22} color={colors.primary} />
          <Text style={styles.title}>Daily Goals</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FormField label="Calories (kcal)" value={calories} onChangeText={setCalories} keyboardType="numeric" />
        <FormField label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" />
        <FormField label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
        <FormField label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" />

        <View style={styles.buttonWrapper}>
          <Button title="Save Goals" onPress={() => save(() => show("Goals saved!"))} loading={saving} />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
    card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadow.sm },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
    title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
    error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: "center" },
    buttonWrapper: { marginTop: spacing.sm },
  });
