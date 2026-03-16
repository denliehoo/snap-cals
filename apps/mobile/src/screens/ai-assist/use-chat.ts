import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChatMessage, AiEstimateResponse } from "@snap-cals/shared";
import { api } from "../../services/api";
import { MainStackParamList } from "../../navigation";

export function useChat() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<AiEstimateResponse | null>(null);

  const sendMessage = async (text: string, forceEstimate = false) => {
    const updated: ChatMessage[] = text
      ? [...messages, { role: "user", content: text }]
      : messages;
    if (text) setMessages(updated);
    setLoading(true);
    try {
      const { data } = await api.chatNutrition({ messages: updated, forceEstimate });
      let content = data.message;
      if (data.estimate) {
        const e = data.estimate;
        content += `\n\n${e.name} (${e.servingSize})\nCalories: ${e.calories} kcal\nProtein: ${e.protein}g · Carbs: ${e.carbs}g · Fat: ${e.fat}g`;
        setEstimate(e);
      }
      setMessages([...updated, { role: "assistant", content }]);
    } catch (e: any) {
      const msg = e.status === 429 ? "AI is busy, try again in a moment" : e.message || "Failed to process chat";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (estimate) navigation.navigate("EntryForm", { prefill: estimate });
  };

  return { messages, loading, estimate, sendMessage, confirm };
}
