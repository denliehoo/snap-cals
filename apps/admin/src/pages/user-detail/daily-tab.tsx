import type { FoodEntry, Goal } from "@snap-cals/shared";
import { MealType } from "@snap-cals/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LoadingOverlay } from "@/components/loading-overlay";
import { get } from "@/services/api";
import { EditEntryModal } from "./edit-entry-modal";
import { formatDate } from "./utils";

const MEAL_ORDER = [
  MealType.BREAKFAST,
  MealType.LUNCH,
  MealType.DINNER,
  MealType.SNACK,
];

export function DailyTab({ userId }: { userId: string }) {
  const [date, setDate] = useState(() => formatDate(new Date()));
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-entries", userId, date],
    queryFn: async () => {
      const res = await get<{ data: FoodEntry[] }>(
        `/admin/users/${userId}/entries?date=${date}`,
      );
      return res.data;
    },
  });

  const { data: goals } = useQuery({
    queryKey: ["admin-goals", userId],
    queryFn: async () => {
      const res = await get<{ data: Goal | null }>(
        `/admin/users/${userId}/goals`,
      );
      return res.data;
    },
  });

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(formatDate(d));
  };

  const invalidateEntries = () => {
    queryClient.invalidateQueries({
      queryKey: ["admin-entries", userId, date],
    });
  };

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const grouped = MEAL_ORDER.map((mt) => ({
    mealType: mt,
    entries: entries.filter((e) => e.mealType === mt),
  })).filter((g) => g.entries.length > 0);

  if (isLoading) return <LoadingOverlay />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => shiftDate(-1)}
          className="px-2 py-1 border border-gray-700 rounded text-sm text-gray-300"
        >
          ←
        </button>
        <span className="text-sm font-medium text-gray-200">{date}</span>
        <button
          type="button"
          onClick={() => shiftDate(1)}
          className="px-2 py-1 border border-gray-700 rounded text-sm text-gray-300"
        >
          →
        </button>
      </div>

      {goals && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {(["calories", "protein", "carbs", "fat"] as const).map((key) => {
            const goalKey =
              `daily${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof Goal;
            const goalVal = goals[goalKey] as number;
            const pct =
              goalVal > 0 ? Math.min(100, (totals[key] / goalVal) * 100) : 0;
            return (
              <div
                key={key}
                className="bg-gray-900 border border-gray-800 rounded-lg p-3"
              >
                <div className="text-xs text-gray-500 capitalize">{key}</div>
                <div className="text-sm font-medium text-gray-200">
                  {Math.round(totals[key])} / {goalVal}
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-green-600 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {grouped.map((g) => (
        <div key={g.mealType} className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2 capitalize">
            {g.mealType.toLowerCase()}
          </h3>
          <div className="space-y-1">
            {g.entries.map((entry) => (
              <button
                type="button"
                key={entry.id}
                onClick={() => setEditing(entry)}
                className="bg-gray-900 border border-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-800 w-full text-left"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-gray-200">
                      {entry.name}
                    </span>
                    {entry.source && (
                      <span className="text-xs text-gray-600 ml-1">
                        · {entry.source}
                      </span>
                    )}
                    <div className="text-xs text-gray-500">
                      {entry.servingSize}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div className="font-medium text-sm text-gray-300">
                      {entry.calories} kcal
                    </div>
                    P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <p className="text-sm text-gray-600 text-center py-8">
          No entries for this date
        </p>
      )}

      {editing && (
        <EditEntryModal
          userId={userId}
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidateEntries();
          }}
        />
      )}
    </div>
  );
}
