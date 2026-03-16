import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { api } from "@/services/api";
import { MainStackParamList } from "@/navigation";

export function useAiAssist() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.estimateNutrition(description.trim());
      navigation.navigate("EntryForm", { prefill: data });
    } catch (e: any) {
      setError(e.message || "Failed to estimate nutrition");
    } finally {
      setLoading(false);
    }
  };

  return { description, setDescription, loading, error, estimate };
}
