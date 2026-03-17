import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "@/services/api";
import { MainStackParamList } from "@/navigation";

export function useAiAssist(onError?: (msg: string) => void) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const estimate = async () => {
    setLoading(true);
    try {
      const { data } = await api.estimateNutrition(description.trim());
      navigation.navigate("EntryForm", { prefill: data });
    } catch (e: any) {
      onError?.(e.message || "Failed to estimate nutrition");
    } finally {
      setLoading(false);
    }
  };

  return { description, setDescription, loading, estimate };
}
