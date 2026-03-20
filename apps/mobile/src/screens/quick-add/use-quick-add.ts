import type { FavoriteFoodItem, RecentFoodItem } from "@snap-cals/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/services/api";

export function useQuickAdd(onError?: (msg: string) => void) {
  const [favorites, setFavorites] = useState<FavoriteFoodItem[]>([]);
  const [recents, setRecents] = useState<RecentFoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const fetch = useCallback(async () => {
    try {
      const [favRes, recRes] = await Promise.all([
        api.getFavorites(),
        api.getRecentFoods(),
      ]);
      setFavorites(favRes.data);
      setRecents(recRes.data);
    } catch {
      onErrorRef.current?.("Failed to load foods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const removeFavorite = async (id: string) => {
    await api.deleteFavorite(id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const addFavorite = async (item: RecentFoodItem) => {
    const res = await api.createFavorite(item);
    setFavorites((prev) => [res.data, ...prev]);
  };

  return { favorites, recents, loading, removeFavorite, addFavorite };
}
