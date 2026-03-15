import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing, fontSize, fontWeight } from "../../theme";
import FormField from "../../components/form-field";
import Button from "../../components/button";
import { useGoals } from "./use-goals";
import { useSnackbar } from "../../components/snackbar";

export default function GoalsScreen() {
  const {
    calories, setCalories,
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    loading, saving, error, save,
  } = useGoals();
  const { show } = useSnackbar();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Goals</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FormField label="Calories (kcal)" value={calories} onChangeText={setCalories} keyboardType="numeric" />
      <FormField label="Protein (g)" value={protein} onChangeText={setProtein} keyboardType="numeric" />
      <FormField label="Carbs (g)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
      <FormField label="Fat (g)" value={fat} onChangeText={setFat} keyboardType="numeric" />

      <View style={styles.buttonWrapper}>
        <Button title="Save Goals" onPress={() => save(() => show("Goals saved!"))} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
  buttonWrapper: { marginTop: spacing.md },
});
