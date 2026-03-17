import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ImageData } from "@snap-cals/shared";
import { api } from "@/services/api";
import { MainStackParamList } from "@/navigation";

export function useAiAssist(onError?: (msg: string) => void) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const estimate = async (image?: ImageData) => {
    setLoading(true);
    try {
      const { data } = await api.estimateNutrition(description.trim(), image);
      navigation.navigate("EntryForm", { prefill: data });
    } catch (e: unknown) {
      const msg = (e as { message?: string }).message || "Failed to estimate nutrition";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return { description, setDescription, loading, estimate };
}
