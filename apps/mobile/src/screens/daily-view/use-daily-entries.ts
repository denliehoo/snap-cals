import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";
import { FoodEntry, MealType, Goal } from "@snap-cals/shared";

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface MealSection {
  title: string;
  mealType: MealType;
  data: FoodEntry[];
  calories: number;
}

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MEAL_ORDER: MealType[] = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];
const MEAL_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: "Breakfast",
  [MealType.LUNCH]: "Lunch",
  [MealType.DINNER]: "Dinner",
  [MealType.SNACK]: "Snack",
};

export function useDailyEntries(initialDate?: string) {
  const navigation = useNavigation();
  const [date, setDate] = useState(() => initialDate || toDateString(new Date()));
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [goals, setGoals] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [entriesRes, goalsRes] = await Promise.all([api.getEntries(date), api.getGoals()]);
      setEntries(entriesRes.data);
      setGoals(goalsRes.data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Re-fetch when screen regains focus (e.g. after creating/editing an entry)
  useEffect(() => {
    const nav = navigation;
    const unsubscribe = nav.addListener("focus", () => fetchEntries(false));
    return unsubscribe;
  }, [navigation, fetchEntries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEntries(false);
  }, [fetchEntries]);

  const sections = useMemo<MealSection[]>(() => {
    const grouped = new Map<MealType, FoodEntry[]>();
    for (const e of entries) {
      const list = grouped.get(e.mealType) || [];
      list.push(e);
      grouped.set(e.mealType, list);
    }
    return MEAL_ORDER
      .filter((m) => grouped.has(m))
      .map((m) => ({
        title: MEAL_LABELS[m],
        mealType: m,
        data: grouped.get(m)!,
        calories: grouped.get(m)!.reduce((s, e) => s + e.calories, 0),
      }));
  }, [entries]);

  const totals = useMemo<DailyTotals>(() => {
    return entries.reduce(
      (t, e) => ({
        calories: t.calories + e.calories,
        protein: t.protein + e.protein,
        carbs: t.carbs + e.carbs,
        fat: t.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [entries]);

  const goToPreviousDay = () => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setDate(toDateString(d));
  };

  const goToNextDay = () => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setDate(toDateString(d));
  };

  const deleteEntry = async (id: string) => {
    await api.deleteEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return { date, sections, totals, goals, loading, refreshing, onRefresh, goToPreviousDay, goToNextDay, deleteEntry };
}
