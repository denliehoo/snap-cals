import type { FoodEntry } from "@snap-cals/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LoadingOverlay } from "@/components/loading-overlay";
import { get } from "@/services/api";
import { formatDate, startOfWeek } from "./utils";

export function WeeklyTab({ userId }: { userId: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-week-entries", userId, formatDate(weekStart)],
    queryFn: async () => {
      const res = await get<{ data: FoodEntry[] }>(
        `/admin/users/${userId}/entries/week?startDate=${formatDate(weekStart)}`,
      );
      return res.data;
    },
  });

  const shiftWeek = (weeks: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + weeks * 7);
    setWeekStart(d);
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    const dayEntries = entries.filter((e) => e.date.split("T")[0] === dateStr);
    return {
      date: dateStr,
      label: d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      calories: dayEntries.reduce((s, e) => s + e.calories, 0),
      protein: dayEntries.reduce((s, e) => s + e.protein, 0),
      carbs: dayEntries.reduce((s, e) => s + e.carbs, 0),
      fat: dayEntries.reduce((s, e) => s + e.fat, 0),
      count: dayEntries.length,
    };
  });

  if (isLoading) return <LoadingOverlay />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          className="px-2 py-1 border border-gray-700 rounded text-sm text-gray-300"
        >
          ←
        </button>
        <span className="text-sm font-medium text-gray-200">
          {formatDate(weekStart)} –{" "}
          {formatDate(new Date(weekStart.getTime() + 6 * 86400000))}
        </span>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          className="px-2 py-1 border border-gray-700 rounded text-sm text-gray-300"
        >
          →
        </button>
      </div>

      <div className="hidden md:block bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">
                Date
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-400">
                Calories
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-400">
                Protein
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-400">
                Carbs
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-400">
                Fat
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-400">
                Entries
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr
                key={day.date}
                className="border-b border-gray-800 text-gray-300"
              >
                <td className="px-4 py-3">{day.label}</td>
                <td className="px-4 py-3 text-right">
                  {Math.round(day.calories)}
                </td>
                <td className="px-4 py-3 text-right">
                  {Math.round(day.protein)}g
                </td>
                <td className="px-4 py-3 text-right">
                  {Math.round(day.carbs)}g
                </td>
                <td className="px-4 py-3 text-right">{Math.round(day.fat)}g</td>
                <td className="px-4 py-3 text-right">{day.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {days.map((day) => (
          <div
            key={day.date}
            className="bg-gray-900 border border-gray-800 rounded-lg p-3"
          >
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-200">
                {day.label}
              </span>
              <span className="text-sm font-medium text-gray-200">
                {Math.round(day.calories)} kcal
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              P {Math.round(day.protein)}g · C {Math.round(day.carbs)}g · F{" "}
              {Math.round(day.fat)}g · {day.count} entries
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
