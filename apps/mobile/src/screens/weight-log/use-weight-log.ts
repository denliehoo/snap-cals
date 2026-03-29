import type { WeightEntry, WeightUnit } from "@snap-cals/shared";
import { useState } from "react";
import { api } from "@/services/api";
import { useSettingsStore } from "@/stores/settings.store";
import { toLocalDateString } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

function toTimeString(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function displayWeight(entry: WeightEntry, unit: WeightUnit) {
  return String(unit === "kg" ? entry.weightKg : entry.weightLbs);
}

/** Allow digits with at most 2 decimal places (e.g. "72", "72.5", "72.35") */
function sanitizeWeight(text: string) {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts[1].slice(0, 2)}`;
}

export function useWeightLog(entry?: WeightEntry) {
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const isEdit = !!entry;

  const [weight, setWeightRaw] = useState(
    entry ? displayWeight(entry, weightUnit) : "",
  );
  const [date, setDate] = useState(
    entry ? toLocalDateString(new Date(entry.loggedAt)) : toLocalDateString(),
  );
  const [time, setTime] = useState(
    entry ? toTimeString(new Date(entry.loggedAt)) : toTimeString(new Date()),
  );
  const [note, setNote] = useState(entry?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setWeight = (text: string) => {
    setWeightRaw(sanitizeWeight(text));
    setError("");
  };

  const submit = async (
    onSuccess: () => void,
    onError: (msg: string) => void,
  ) => {
    const val = Number.parseFloat(weight);
    if (!weight || Number.isNaN(val) || val <= 0) {
      setError("Enter a valid weight");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const loggedAt = new Date(`${date}T${time}:00`).toISOString();
      if (isEdit && entry) {
        await api.updateWeight(entry.id, {
          weight: val,
          unit: weightUnit,
          loggedAt,
          note: note || undefined,
        });
      } else {
        await api.createWeight({
          weight: val,
          unit: weightUnit,
          loggedAt,
          note: note || undefined,
        });
      }
      onSuccess();
    } catch (e: unknown) {
      onError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return {
    isEdit,
    weightUnit,
    weight,
    setWeight,
    date,
    setDate,
    time,
    setTime,
    note,
    setNote,
    loading,
    error,
    submit,
  };
}
