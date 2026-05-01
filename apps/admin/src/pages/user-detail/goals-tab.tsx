import type { Goal } from "@snap-cals/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Field } from "@/components/field";
import { LoadingOverlay } from "@/components/loading-overlay";
import { get, put } from "@/services/api";

export function GoalsTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    dailyCalories: "",
    dailyProtein: "",
    dailyCarbs: "",
    dailyFat: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: goals, isLoading } = useQuery({
    queryKey: ["admin-goals", userId],
    queryFn: async () => {
      const res = await get<{ data: Goal | null }>(
        `/admin/users/${userId}/goals`,
      );
      if (res.data) {
        setForm({
          dailyCalories: String(res.data.dailyCalories),
          dailyProtein: String(res.data.dailyProtein),
          dailyCarbs: String(res.data.dailyCarbs),
          dailyFat: String(res.data.dailyFat),
        });
      }
      return res.data;
    },
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await put(`/admin/users/${userId}/goals`, {
        dailyCalories: Number(form.dailyCalories),
        dailyProtein: Number(form.dailyProtein),
        dailyCarbs: Number(form.dailyCarbs),
        dailyFat: Number(form.dailyFat),
      });
      setSuccess("Goals saved");
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["admin-goals", userId] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) return <LoadingOverlay />;

  if (!editMode) {
    return (
      <div>
        {success && (
          <p className="text-sm text-green-400 bg-green-900/30 p-2 rounded mb-3">
            {success}
          </p>
        )}
        {goals ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Calories</span>
                <div className="font-medium text-gray-200">
                  {goals.dailyCalories}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Protein</span>
                <div className="font-medium text-gray-200">
                  {goals.dailyProtein}g
                </div>
              </div>
              <div>
                <span className="text-gray-500">Carbs</span>
                <div className="font-medium text-gray-200">
                  {goals.dailyCarbs}g
                </div>
              </div>
              <div>
                <span className="text-gray-500">Fat</span>
                <div className="font-medium text-gray-200">
                  {goals.dailyFat}g
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="mt-4 px-4 py-2 bg-green-700 text-white rounded text-sm font-medium"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600 mb-3">No goals set</p>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-green-700 text-white rounded text-sm font-medium"
            >
              Set Goals
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 max-w-sm">
      {error && (
        <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded mb-3">
          {error}
        </p>
      )}
      <div className="space-y-3">
        <Field
          label="Daily Calories"
          value={form.dailyCalories}
          onChange={(v) => set("dailyCalories", v)}
          type="number"
        />
        <Field
          label="Daily Protein (g)"
          value={form.dailyProtein}
          onChange={(v) => set("dailyProtein", v)}
          type="number"
        />
        <Field
          label="Daily Carbs (g)"
          value={form.dailyCarbs}
          onChange={(v) => set("dailyCarbs", v)}
          type="number"
        />
        <Field
          label="Daily Fat (g)"
          value={form.dailyFat}
          onChange={(v) => set("dailyFat", v)}
          type="number"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={() => setEditMode(false)}
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
  );
}
