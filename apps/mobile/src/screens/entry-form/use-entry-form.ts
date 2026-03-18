import { useState } from "react";
import { Alert } from "react-native";
import { MealType, FoodEntry, AiEstimateResponse } from "@snap-cals/shared";
import { api } from "@/services/api";
import { toLocalDateString } from "@/utils/date";
import type { EntryFormPrefill } from "@/navigation";

function guessMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 10) return MealType.BREAKFAST;
  if (hour >= 11 && hour <= 14) return MealType.LUNCH;
  if (hour >= 17 && hour <= 21) return MealType.DINNER;
  return MealType.SNACK;
}

export function useEntryForm(entry?: FoodEntry, prefill?: EntryFormPrefill, onError?: (msg: string) => void) {
  const isEdit = !!entry;
  const isPrefill = !isEdit && !!prefill;

  const [name, setName] = useState(entry?.name || prefill?.name || "");
  const [calories, setCalories] = useState(entry ? String(entry.calories) : prefill ? String(prefill.calories) : "");
  const [protein, setProtein] = useState(entry ? String(entry.protein) : prefill ? String(prefill.protein) : "");
  const [carbs, setCarbs] = useState(entry ? String(entry.carbs) : prefill ? String(prefill.carbs) : "");
  const [fat, setFat] = useState(entry ? String(entry.fat) : prefill ? String(prefill.fat) : "");
  const [servingSize, setServingSize] = useState(entry?.servingSize || prefill?.servingSize || "");
  const [mealType, setMealType] = useState<MealType>(
    (entry?.mealType as MealType) || prefill?.mealType || guessMealType()
  );
  const [date, setDate] = useState(
    entry?.date?.split("T")[0] || toLocalDateString()
  );
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required";
    if (!calories.trim()) errors.calories = "Calories is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (onSuccess: () => void) => {
    if (!validate()) return;
    setLoading(true);
    try {
      const data = {
        name,
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        servingSize,
        mealType,
        date,
      };
      if (isEdit) {
        await api.updateEntry(entry!.id, data);
      } else {
        await api.createEntry(data);
      }
      onSuccess();
    } catch (e: any) {
      onError?.(e.message || "Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (onSuccess: () => void) => {
    Alert.alert("Delete Entry", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteEntry(entry!.id);
            onSuccess();
          } catch (e: any) {
            onError?.(e.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  return {
    isEdit,
    isPrefill,
    fields: { name, calories, protein, carbs, fat, servingSize, mealType, date },
    setters: { setName, setCalories, setProtein, setCarbs, setFat, setServingSize, setMealType, setDate },
    loading,
    fieldErrors,
    clearFieldError,
    submit,
    confirmDelete,
  };
}
