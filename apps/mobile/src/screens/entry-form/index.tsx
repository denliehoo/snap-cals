import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MealType } from "@snap-cals/shared";
import { colors, spacing, fontSize, borderRadius, fontWeight } from "../../theme";
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

      <Text style={styles.label}>Food Name *</Text>
      <TextInput style={styles.input} value={fields.name} onChangeText={setters.setName} placeholder="e.g. Chicken Breast" placeholderTextColor={colors.textSecondary} />

      <Text style={styles.label}>Calories *</Text>
      <TextInput style={styles.input} value={fields.calories} onChangeText={setters.setCalories} placeholder="0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput style={styles.input} value={fields.protein} onChangeText={setters.setProtein} placeholder="0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput style={styles.input} value={fields.carbs} onChangeText={setters.setCarbs} placeholder="0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Fat (g)</Text>
          <TextInput style={styles.input} value={fields.fat} onChangeText={setters.setFat} placeholder="0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
        </View>
      </View>

      <Text style={styles.label}>Serving Size</Text>
      <TextInput style={styles.input} value={fields.servingSize} onChangeText={setters.setServingSize} placeholder="e.g. 100g, 1 cup" placeholderTextColor={colors.textSecondary} />

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

      <Text style={styles.label}>Date</Text>
      <TextInput style={styles.input} value={fields.date} onChangeText={setters.setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />

      <TouchableOpacity style={styles.button} onPress={() => submit(goBack)} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.buttonText}>{isEdit ? "Update" : "Add Entry"}</Text>
        )}
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(goBack)}>
          <Text style={styles.deleteButtonText}>Delete Entry</Text>
        </TouchableOpacity>
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
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: { color: colors.textOnPrimary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  deleteButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  deleteButtonText: { color: colors.error, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
