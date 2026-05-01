import { useNavigate } from "react-router-dom";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useUsers } from "./use-users";
import { UserCardList, UserTable } from "./user-list";

export function UsersPage() {
  const navigate = useNavigate();
  const {
    data,
    search,
    handleSearch,
    page,
    setPage,
    totalPages,
    error,
    isLoading,
  } = useUsers();

  const goToUser = (id: string) => navigate(`/users/${id}`);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-100 mb-4">Users</h1>
      <label htmlFor="user-search" className="sr-only">
        Search by email
      </label>
      <input
        id="user-search"
        type="text"
        placeholder="Search by email…"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-green-600"
      />
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {isLoading && <LoadingOverlay />}

      {!isLoading && data?.users.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-12">
          No users found{search ? ` matching "${search}"` : ""}
        </p>
      )}

      {data?.users && data.users.length > 0 && (
        <>
          <UserTable users={data.users} onSelect={goToUser} />
          <UserCardList users={data.users} onSelect={goToUser} />
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-sm px-3 py-1 rounded border border-gray-700 text-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-sm px-3 py-1 rounded border border-gray-700 text-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
