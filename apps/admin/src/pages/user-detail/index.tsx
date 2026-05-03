import type { AdminUserSummary } from "@snap-cals/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get } from "@/services/api";
import { DailyTab } from "./daily-tab";
import { GoalsTab } from "./goals-tab";
import { StatusTab } from "./status-tab";
import { WeeklyTab } from "./weekly-tab";
import { WeightTab } from "./weight-tab";

type Tab = "daily" | "weekly" | "weight" | "goals" | "status";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("daily");

  const { data: user } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await get<{ data: AdminUserSummary }>(`/admin/users/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  if (!id) return null;

  return (
    <div>
      <Link
        to="/users"
        className="text-sm text-green-400 hover:underline mb-3 inline-block"
      >
        ← Back to Users
      </Link>
      {user && (
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-100">{user.email}</h1>
          <p className="text-sm text-gray-500">
            {user.subscriptionTier} · Joined{" "}
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}
      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {(["daily", "weekly", "weight", "goals", "status"] as Tab[]).map(
          (t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm capitalize ${
                tab === t
                  ? "border-b-2 border-green-400 text-green-400 font-medium"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {tab === "daily" && <DailyTab userId={id} />}
      {tab === "weekly" && <WeeklyTab userId={id} />}
      {tab === "weight" && <WeightTab userId={id} />}
      {tab === "goals" && <GoalsTab userId={id} />}
      {tab === "status" && <StatusTab userId={id} />}
    </div>
  );
}
