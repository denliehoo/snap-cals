import { useFocusEffect } from "@react-navigation/native";
import type { WeightEntry } from "@snap-cals/shared";
import { useCallback, useState } from "react";
import { api } from "@/services/api";
import { useSettingsStore } from "@/stores/settings.store";

type Range = "7d" | "30d" | "90d" | "all";

function rangeToFrom(range: Range): string {
  if (range === "all") return new Date(2000, 0, 1).toISOString();
  const d = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function useWeightHistory() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(true);
  const weightUnit = useSettingsStore((s) => s.weightUnit);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getWeightEntries(
        rangeToFrom(range),
        new Date().toISOString(),
      );
      setEntries(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
    }, [fetchEntries]),
  );

  const deleteEntry = async (id: string) => {
    await api.deleteWeight(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const chartData = [...entries].reverse().map((e) => ({
    value: weightUnit === "kg" ? e.weightKg : e.weightLbs,
    date: new Date(e.loggedAt),
  }));

  return {
    entries,
    chartData,
    range,
    setRange,
    loading,
    deleteEntry,
    refresh: fetchEntries,
    weightUnit,
  };
}
