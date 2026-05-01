import type { AdminUserListResponse } from "@snap-cals/shared";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { get } from "@/services/api";

export function useUsers() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data, error, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await get<{ data: AdminUserListResponse }>(
        `/admin/users?${params}`,
      );
      return res.data;
    },
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;
  const errorMsg = error instanceof Error ? error.message : "";

  return {
    data: data ?? null,
    search,
    handleSearch,
    page,
    setPage,
    totalPages,
    error: errorMsg,
    isLoading,
  };
}
