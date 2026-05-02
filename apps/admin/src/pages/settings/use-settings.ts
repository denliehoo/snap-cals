import type { PlatformSettings } from "@snap-cals/shared";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { get, put } from "@/services/api";

interface ApiResponse<T> {
  data: T;
}

export function useSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    get<ApiResponse<PlatformSettings>>("/admin/settings")
      .then((res) => setSettings(res.data))
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const update = async (updates: Partial<PlatformSettings>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await put<ApiResponse<PlatformSettings>>(
        "/admin/settings",
        updates,
      );
      setSettings(res.data);
      show("Settings saved", "success");
    } catch {
      show("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, error, update };
}
