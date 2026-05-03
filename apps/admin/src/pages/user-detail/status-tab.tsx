import type { AdminUserSummary } from "@snap-cals/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmModal } from "@/components/confirm-modal";
import { useToast } from "@/components/toast";
import { get, patch } from "@/services/api";

const STATUSES = ["VERIFIED", "UNVERIFIED", "DEACTIVATED"] as const;

const badgeStyles: Record<string, string> = {
  VERIFIED: "bg-green-900/50 text-green-400",
  UNVERIFIED: "bg-yellow-900/50 text-yellow-400",
  DEACTIVATED: "bg-red-900/50 text-red-400",
};

export function StatusTab({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { show } = useToast();

  const { data: user } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const res = await get<{ data: AdminUserSummary }>(
        `/admin/users/${userId}`,
      );
      return res.data;
    },
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const current = user?.status ?? "";
  const value = selected ?? current;

  const mutation = useMutation({
    mutationFn: (status: string) =>
      patch<{ data: AdminUserSummary }>(`/admin/users/${userId}/status`, {
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      show("Status updated");
      setSelected(null);
      setConfirmOpen(false);
    },
    onError: (err: Error) => {
      show(err.message || "Failed to update status", "error");
      setConfirmOpen(false);
    },
  });

  const handleSave = () => {
    if (value === current) return;
    if (value === "DEACTIVATED") {
      setConfirmOpen(true);
    } else {
      mutation.mutate(value);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md">
      <div className="mb-4">
        <span className="text-sm text-gray-400">Current status: </span>
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${badgeStyles[current] ?? "bg-gray-800 text-gray-400"}`}
        >
          {current}
        </span>
      </div>

      <label
        htmlFor="status-select"
        className="block text-sm text-gray-400 mb-1"
      >
        Change status
      </label>
      <select
        id="status-select"
        value={value}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 mb-4"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={value === current || mutation.isPending}
        onClick={handleSave}
        className="px-4 py-2 text-sm rounded font-medium text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mutation.isPending ? "Saving..." : "Save"}
      </button>

      <ConfirmModal
        open={confirmOpen}
        title="Deactivate user"
        message="This will immediately lock the user out of the app. Are you sure?"
        confirmLabel="Deactivate"
        confirmVariant="danger"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate(value)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
