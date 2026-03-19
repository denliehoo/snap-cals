import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MealType } from "@snap-cals/shared";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "@/components/button";
import DatePickerModal from "@/components/date-picker-modal";
import FormField from "@/components/form-field";
import { useSnackbar } from "@/components/snackbar";
import { useColors } from "@/contexts/theme-context";
import type { MainStackParamList } from "@/navigation";
import { borderRadius, fontSize, fontWeight, spacing } from "@/theme";
import { parseLocalDate } from "@/utils/date";
import { useEntryForm } from "./use-entry-form";

type Props = NativeStackScreenProps<MainStackParamList, "EntryForm">;

const MEAL_TYPES = Object.values(MealType);

export default function EntryFormScreen({ navigation, route }: Props) {
  const colors = useColors();
  const { show } = useSnackbar();
  const {
    isEdit,
    isPrefill,
    fields,
    setters,
    loading,
    fieldErrors,
    clearFieldError,
    submit,
    confirmDelete,
  } = useEntryForm(route.params?.entry, route.params?.prefill, (msg) =>
    show(msg, "error"),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const dateLabel = parseLocalDate(fields.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const goBack = (message: string) => {
    show(message);
    if (isPrefill) {
      navigation.popToTop();
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{isEdit ? "Edit Entry" : "Add Entry"}</Text>

      <FormField
        label="Food Name *"
        value={fields.name}
        onChangeText={(v) => {
          setters.setName(v);
          clearFieldError("name");
        }}
        placeholder="e.g. Chicken Breast"
        error={fieldErrors.name}
      />
      <FormField
        label="Calories *"
        value={fields.calories}
        onChangeText={(v) => {
          setters.setCalories(v);
          clearFieldError("calories");
        }}
        placeholder="0"
        keyboardType="numeric"
        error={fieldErrors.calories}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <FormField
            label="Protein (g)"
            value={fields.protein}
            onChangeText={setters.setProtein}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.rowItem}>
          <FormField
            label="Carbs (g)"
            value={fields.carbs}
            onChangeText={setters.setCarbs}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.rowItem}>
          <FormField
            label="Fat (g)"
            value={fields.fat}
            onChangeText={setters.setFat}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>

      <FormField
        label="Serving Size"
        value={fields.servingSize}
        onChangeText={setters.setServingSize}
        placeholder="e.g. 100g, 1 cup"
      />

      <Text style={styles.label}>Meal Type</Text>
      <View style={styles.mealRow}>
        {MEAL_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.mealChip,
              fields.mealType === type && styles.mealChipActive,
            ]}
            onPress={() => setters.setMealType(type)}
          >
            <Text
              style={[
                styles.mealChipText,
                fields.mealType === type && styles.mealChipTextActive,
              ]}
            >
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FormField
        label="Date"
        value={dateLabel}
        onChangeText={() => {}}
        onPress={() => setShowDatePicker(true)}
        editable={false}
      />
      <DatePickerModal
        visible={showDatePicker}
        value={fields.date}
        onClose={() => setShowDatePicker(false)}
        onSelect={setters.setDate}
      />

      <View style={styles.actions}>
        <Button
          title={isEdit ? "Update" : "Add Entry"}
          onPress={() =>
            submit(() => goBack(isEdit ? "Entry updated" : "Entry added"))
          }
          loading={loading}
        />
        {isEdit && (
          <Button
            title="Delete Entry"
            onPress={() => confirmDelete(() => goBack("Entry deleted"))}
            variant="text-danger"
          />
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    row: { flexDirection: "row", gap: spacing.sm },
    rowItem: { flex: 1 },
    mealRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    mealChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    mealChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    mealChipText: { fontSize: fontSize.sm, color: colors.textSecondary },
    mealChipTextActive: {
      color: colors.textOnPrimary,
      fontWeight: fontWeight.medium,
    },
    actions: { marginTop: spacing.sm, gap: spacing.sm },
  });
