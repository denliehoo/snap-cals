import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { MealType } from "@snap-cals/shared";
import { colors, spacing, fontSize, borderRadius, fontWeight } from "../../theme";
import FormField from "../../components/form-field";
import Button from "../../components/button";
import { useEntryForm } from "./use-entry-form";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<MainStackParamList, "EntryForm">;

const MEAL_TYPES = Object.values(MealType);

export default function EntryFormScreen({ navigation, route }: Props) {
  const { isEdit, fields, setters, loading, error, submit, confirmDelete } =
    useEntryForm(route.params?.entry);

  const goBack = () => navigation.goBack();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEdit ? "Edit Entry" : "Add Entry"}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FormField label="Food Name *" value={fields.name} onChangeText={setters.setName} placeholder="e.g. Chicken Breast" />
      <FormField label="Calories *" value={fields.calories} onChangeText={setters.setCalories} placeholder="0" keyboardType="numeric" />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormField label="Protein (g)" value={fields.protein} onChangeText={setters.setProtein} placeholder="0" keyboardType="numeric" />
        </View>
        <View style={styles.rowItem}>
          <FormField label="Carbs (g)" value={fields.carbs} onChangeText={setters.setCarbs} placeholder="0" keyboardType="numeric" />
        </View>
        <View style={styles.rowItem}>
          <FormField label="Fat (g)" value={fields.fat} onChangeText={setters.setFat} placeholder="0" keyboardType="numeric" />
        </View>
      </View>

      <FormField label="Serving Size" value={fields.servingSize} onChangeText={setters.setServingSize} placeholder="e.g. 100g, 1 cup" />

      <Text style={styles.label}>Meal Type</Text>
      <View style={styles.mealRow}>
        {MEAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.mealChip, fields.mealType === type && styles.mealChipActive]}
            onPress={() => setters.setMealType(type)}
          >
            <Text style={[styles.mealChipText, fields.mealType === type && styles.mealChipTextActive]}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FormField label="Date" value={fields.date} onChangeText={setters.setDate} placeholder="YYYY-MM-DD" />

      <Button title={isEdit ? "Update" : "Add Entry"} onPress={() => submit(goBack)} loading={loading} />

      {isEdit && (
        <Button title="Delete Entry" onPress={() => confirmDelete(goBack)} variant="text-danger" />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  rowItem: { flex: 1 },
  mealRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  mealChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mealChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mealChipText: { fontSize: fontSize.sm, color: colors.textSecondary },
  mealChipTextActive: { color: colors.textOnPrimary },
});
