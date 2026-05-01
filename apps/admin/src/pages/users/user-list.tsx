import type { AdminUserSummary } from "@snap-cals/shared";

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        tier === "PRO"
          ? "bg-green-900/50 text-green-400"
          : "bg-gray-800 text-gray-400"
      }`}
    >
      {tier}
    </span>
  );
}

export function UserTable({
  users,
  onSelect,
}: {
  users: AdminUserSummary[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="hidden md:block bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-800 border-b border-gray-700">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-400">
              Email
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-400">
              Tier
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-400">
              Signup Date
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-400">
              Verified
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              onClick={() => onSelect(user.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(user.id);
              }}
              tabIndex={0}
              className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer text-gray-300"
            >
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <TierBadge tier={user.subscriptionTier} />
              </td>
              <td className="px-4 py-3 text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">{user.emailVerified ? "✓" : "✗"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UserCardList({
  users,
  onSelect,
}: {
  users: AdminUserSummary[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="md:hidden space-y-2">
      {users.map((user) => (
        <button
          type="button"
          key={user.id}
          onClick={() => onSelect(user.id)}
          className="bg-gray-900 border border-gray-800 rounded-lg p-4 cursor-pointer text-left w-full"
        >
          <div className="font-medium text-sm text-gray-200">{user.email}</div>
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            <TierBadge tier={user.subscriptionTier} />
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            <span>{user.emailVerified ? "Verified" : "Unverified"}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
