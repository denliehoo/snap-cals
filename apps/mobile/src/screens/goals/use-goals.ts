import { useEffect, useState } from "react";
import type { GoalRecommendation } from "@snap-cals/shared";
import { api } from "@/services/api";
import { getErrorMessage } from "@/utils/error";

const DEFAULTS = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 250,
  dailyFat: 65,
};

export function useGoals(prefill?: GoalRecommendation) {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [loading, setLoading] = useState(!prefill);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  useEffect(() => {
    if (prefill) {
      setCalories(String(prefill.dailyCalories));
      setProtein(String(prefill.dailyProtein));
      setCarbs(String(prefill.dailyCarbs));
      setFat(String(prefill.dailyFat));
      return;
    }
    (async () => {
      try {
        const res = await api.getGoals();
        const g = res.data;
        setCalories(String(g.dailyCalories));
        setProtein(String(g.dailyProtein));
        setCarbs(String(g.dailyCarbs));
        setFat(String(g.dailyFat));
      } catch {
        setCalories(String(DEFAULTS.dailyCalories));
        setProtein(String(DEFAULTS.dailyProtein));
        setCarbs(String(DEFAULTS.dailyCarbs));
        setFat(String(DEFAULTS.dailyFat));
      } finally {
        setLoading(false);
      }
    })();
  }, [prefill]);

  const save = async (
    onSuccess?: () => void,
    onError?: (msg: string) => void,
  ) => {
    const fields = { calories, protein, carbs, fat };
    const labels: Record<string, string> = {
      calories: "Calories (kcal)",
      protein: "Protein (g)",
      carbs: "Carbs (g)",
      fat: "Fat (g)",
    };
    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (!val.trim()) {
        errors[key] = `${labels[key]} is required`;
        continue;
      }
      const n = Number(val);
      if (Number.isNaN(n) || n < 0)
        errors[key] = `${labels[key]} must be a valid number >= 0`;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      await api.upsertGoals({
        dailyCalories: Number(calories),
        dailyProtein: Number(protein),
        dailyCarbs: Number(carbs),
        dailyFat: Number(fat),
      });
      onSuccess?.();
    } catch (e: unknown) {
      onError?.(getErrorMessage(e, "Failed to save goals"));
    } finally {
      setSaving(false);
    }
  };

  return {
    calories,
    setCalories,
    protein,
    setProtein,
    carbs,
    setCarbs,
    fat,
    setFat,
    loading,
    saving,
    fieldErrors,
    clearFieldError,
    save,
  };
}
