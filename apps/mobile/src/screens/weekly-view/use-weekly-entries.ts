import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { api } from "../../services/api";
import { FoodEntry, Goal } from "@snap-cals/shared";

function toDateString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

export interface DaySummary {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entryCount: number;
}

export function useWeeklyEntries() {
  const navigation = useNavigation();
  const [weekStart, setWeekStart] = useState(() => toDateString(getMonday(new Date())));
  const [days, setDays] = useState<DaySummary[]>([]);
  const [goals, setGoals] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeek = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const [entriesRes, goalsRes] = await Promise.all([
        api.getWeekEntries(weekStart),
        api.getGoals(),
      ]);
      setGoals(goalsRes.data);

      const byDate = new Map<string, FoodEntry[]>();
      for (const e of entriesRes.data) {
        const d = e.date.split("T")[0];
        const list = byDate.get(d) || [];
        list.push(e);
        byDate.set(d, list);
      }

      const start = new Date(weekStart + "T00:00:00");
      const summaries: DaySummary[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = toDateString(d);
        const entries = byDate.get(dateStr) || [];
        summaries.push({
          date: dateStr,
          label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          calories: entries.reduce((s, e) => s + e.calories, 0),
          protein: entries.reduce((s, e) => s + e.protein, 0),
          carbs: entries.reduce((s, e) => s + e.carbs, 0),
          fat: entries.reduce((s, e) => s + e.fat, 0),
          entryCount: entries.length,
        });
      }
      setDays(summaries);
    } catch {
      setDays([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => fetchWeek(false));
    return unsubscribe;
  }, [navigation, fetchWeek]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWeek(false);
  }, [fetchWeek]);

  const goToPreviousWeek = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setWeekStart(toDateString(d));
  };

  const goToNextWeek = () => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setWeekStart(toDateString(d));
  };

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [weekStart]);

  return { days, goals, weekLabel, loading, refreshing, onRefresh, goToPreviousWeek, goToNextWeek };
}
