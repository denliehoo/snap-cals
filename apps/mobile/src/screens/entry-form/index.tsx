import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { MealType } from "@snap-cals/shared";
import { spacing, fontSize, borderRadius, fontWeight } from "../../theme";
import { useColors } from "../../contexts/theme-context";
import FormField from "../../components/form-field";
import Button from "../../components/button";
import { useEntryForm } from "./use-entry-form";
import { useSnackbar } from "../../components/snackbar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation";

type Props = NativeStackScreenProps<MainStackParamList, "EntryForm">;

const MEAL_TYPES = Object.values(MealType);

export default function EntryFormScreen({ navigation, route }: Props) {
  const colors = useColors();
  const { isEdit, isPrefill, fields, setters, loading, error, fieldErrors, clearFieldError, submit, confirmDelete } =
    useEntryForm(route.params?.entry, route.params?.prefill);
  const { show } = useSnackbar();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const goBack = () => {
    show(isEdit ? "Entry updated" : "Entry added");
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{isPrefill ? "Review AI Estimate" : isEdit ? "Edit Entry" : "Add Entry"}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FormField label="Food Name *" value={fields.name} onChangeText={(v) => { setters.setName(v); clearFieldError("name"); }} placeholder="e.g. Chicken Breast" error={fieldErrors.name} />
      <FormField label="Calories *" value={fields.calories} onChangeText={(v) => { setters.setCalories(v); clearFieldError("calories"); }} placeholder="0" keyboardType="numeric" error={fieldErrors.calories} />

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

      <View style={styles.actions}>
        <Button title={isEdit ? "Update" : "Add Entry"} onPress={() => submit(goBack)} loading={loading} />
        {isEdit && (
          <Button title="Delete Entry" onPress={() => confirmDelete(goBack)} variant="text-danger" />
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
    title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text, marginBottom: spacing.sm },
    error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md, textAlign: "center" },
    row: { flexDirection: "row", gap: spacing.sm },
    rowItem: { flex: 1 },
    mealRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
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
    mealChipTextActive: { color: colors.textOnPrimary, fontWeight: fontWeight.medium },
    actions: { marginTop: spacing.sm, gap: spacing.sm },
  });
