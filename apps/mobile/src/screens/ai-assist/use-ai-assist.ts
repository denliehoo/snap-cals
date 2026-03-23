import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ImageData } from "@snap-cals/shared";
import { useState } from "react";
import type { MainStackParamList } from "@/navigation";
import { api } from "@/services/api";
import { useUsageStore } from "@/stores/usage.store";

export function useAiAssist(onError?: (msg: string) => void) {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const fetchUsage = useUsageStore((s) => s.fetch);

  const estimate = async (image?: ImageData) => {
    setLoading(true);
    try {
      const { data } = await api.estimateNutrition(description.trim(), image);
      fetchUsage();
      navigation.navigate("EntryForm", { prefill: data });
    } catch (e: unknown) {
      const msg =
        (e as { message?: string }).message || "Failed to estimate nutrition";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return { description, setDescription, loading, estimate };
}
