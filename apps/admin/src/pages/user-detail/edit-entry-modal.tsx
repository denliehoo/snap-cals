import type { FoodEntry } from "@snap-cals/shared";
import { MealType } from "@snap-cals/shared";
import { useId, useState } from "react";
import { Field } from "@/components/field";
import { put } from "@/services/api";

const MEAL_ORDER = [
  MealType.BREAKFAST,
  MealType.LUNCH,
  MealType.DINNER,
  MealType.SNACK,
];

export function EditEntryModal({
  userId,
  entry,
  onClose,
  onSaved,
}: {
  userId: string;
  entry: FoodEntry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: entry.name,
    calories: String(entry.calories),
    protein: String(entry.protein),
    carbs: String(entry.carbs),
    fat: String(entry.fat),
    servingSize: entry.servingSize,
    source: entry.source || "",
    mealType: entry.mealType,
    date: entry.date.split("T")[0],
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const mealTypeId = useId();

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await put(`/admin/users/${userId}/entries/${entry.id}`, {
        name: form.name,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        servingSize: form.servingSize,
        source: form.source || undefined,
        mealType: form.mealType,
        date: form.date,
      });
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-lg font-bold text-gray-100 mb-4">Edit Entry</h2>
        {error && (
          <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded mb-3">
            {error}
          </p>
        )}
        <div className="space-y-3">
          <Field
            label="Name"
            value={form.name}
            onChange={(v) => set("name", v)}
          />
          <Field
            label="Calories"
            value={form.calories}
            onChange={(v) => set("calories", v)}
            type="number"
          />
          <Field
            label="Protein (g)"
            value={form.protein}
            onChange={(v) => set("protein", v)}
            type="number"
          />
          <Field
            label="Carbs (g)"
            value={form.carbs}
            onChange={(v) => set("carbs", v)}
            type="number"
          />
          <Field
            label="Fat (g)"
            value={form.fat}
            onChange={(v) => set("fat", v)}
            type="number"
          />
          <Field
            label="Serving Size"
            value={form.servingSize}
            onChange={(v) => set("servingSize", v)}
          />
          <Field
            label="Source"
            value={form.source}
            onChange={(v) => set("source", v)}
          />
          <div>
            <label
              htmlFor={mealTypeId}
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Meal Type
            </label>
            <select
              id={mealTypeId}
              value={form.mealType}
              onChange={(e) => set("mealType", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100"
            >
              {MEAL_ORDER.map((mt) => (
                <option key={mt} value={mt}>
                  {mt}
                </option>
              ))}
            </select>
          </div>
          <Field
            label="Date"
            value={form.date}
            onChange={(v) => set("date", v)}
            type="date"
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 border border-gray-700 rounded text-sm text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-3 py-2 bg-green-700 text-white rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
