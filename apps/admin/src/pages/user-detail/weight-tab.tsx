import type { WeightEntry } from "@snap-cals/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LoadingOverlay } from "@/components/loading-overlay";
import { get } from "@/services/api";

export function WeightTab({ userId }: { userId: string }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["admin-weight", userId, range],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (range !== "all") {
        const d = new Date();
        d.setDate(
          d.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : 90),
        );
        params.set("from", d.toISOString());
      }
      const res = await get<{ data: WeightEntry[] }>(
        `/admin/users/${userId}/weight?${params}`,
      );
      return res.data;
    },
  });

  if (isLoading) return <LoadingOverlay />;

  const chartData = [...entries]
    .sort(
      (a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime(),
    )
    .map((e) => ({
      date: new Date(e.loggedAt).toLocaleDateString(),
      kg: e.weightKg,
    }));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["7d", "30d", "90d", "all"] as const).map((r) => (
          <button
            type="button"
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 text-sm rounded ${range === r ? "bg-green-700 text-white" : "border border-gray-700 text-gray-400"}`}
          >
            {r === "all" ? "All" : r}
          </button>
        ))}
      </div>

      {chartData.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: 8,
                  color: "#F3F4F6",
                }}
              />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="#4ADE80"
                strokeWidth={2}
                dot={{ r: 3, fill: "#4ADE80" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-1">
        {entries.map((e) => (
          <div
            key={e.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-3"
          >
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">
                {new Date(e.loggedAt).toLocaleString()}
              </span>
              <span className="text-sm font-medium text-gray-200">
                {e.weightKg} kg / {e.weightLbs} lbs
              </span>
            </div>
            {e.note && <p className="text-xs text-gray-500 mt-1">{e.note}</p>}
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-8">
            No weight entries
          </p>
        )}
      </div>
    </div>
  );
}
