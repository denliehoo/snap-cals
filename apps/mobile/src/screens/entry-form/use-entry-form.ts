import { useState } from "react";
import { Alert } from "react-native";
import { MealType, FoodEntry } from "@snap-cals/shared";
import { api } from "../../services/api";

export function useEntryForm(entry?: FoodEntry) {
  const isEdit = !!entry;

  const [name, setName] = useState(entry?.name || "");
  const [calories, setCalories] = useState(entry ? String(entry.calories) : "");
  const [protein, setProtein] = useState(entry ? String(entry.protein) : "");
  const [carbs, setCarbs] = useState(entry ? String(entry.carbs) : "");
  const [fat, setFat] = useState(entry ? String(entry.fat) : "");
  const [servingSize, setServingSize] = useState(entry?.servingSize || "");
  const [mealType, setMealType] = useState<MealType>(
    (entry?.mealType as MealType) || MealType.LUNCH
  );
  const [date, setDate] = useState(
    entry?.date?.split("T")[0] || new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!name || !calories) {
      setError("Name and calories are required");
      return false;
    }
    return true;
  };

  const submit = async (onSuccess: () => void) => {
    if (!validate()) return;
    setLoading(true);
    setError("");
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
      setError(e.message || "Failed to save entry");
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
            setError(e.message || "Failed to delete");
          }
        },
      },
    ]);
  };

  return {
    isEdit,
    fields: { name, calories, protein, carbs, fat, servingSize, mealType, date },
    setters: { setName, setCalories, setProtein, setCarbs, setFat, setServingSize, setMealType, setDate },
    loading,
    error,
    submit,
    confirmDelete,
  };
}
