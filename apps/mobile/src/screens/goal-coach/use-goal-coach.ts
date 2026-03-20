import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ChatMessage, GoalRecommendation } from "@snap-cals/shared";
import { useEffect, useState } from "react";
import type { MainStackParamList } from "@/navigation";
import { api } from "@/services/api";

const GREETING =
  "I'd love to help! To calculate your ideal daily targets, I need a few details. You can share as many as you'd like in one message:\n\n• What's your goal? (lose weight, gain muscle, maintain, or body recomp)\n• Sex (male/female)\n• Age\n• Current weight (kg)\n• Height (cm)\n• How active are you? (sedentary, light, moderate, very, or extreme)";

export function useGoalCoach() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "user", content: "I'd like help setting my nutrition goals" },
  ]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] =
    useState<GoalRecommendation | null>(null);

  // Simulate AI typing delay for the fake greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: GREETING },
      ]);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = async (text: string) => {
    const updated: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(updated);
    setLoading(true);
    try {
      const { data } = await api.goalCoach({ messages: updated });
      let content = data.message;
      if (data.recommendation) {
        const r = data.recommendation;
        content += `\n\nRecommended Daily Goals:\n🔥 Calories: ${r.dailyCalories} kcal\n🥩 Protein: ${r.dailyProtein}g\n🍞 Carbs: ${r.dailyCarbs}g\n🧈 Fat: ${r.dailyFat}g`;
        setRecommendation(r);
      }
      setMessages([...updated, { role: "assistant", content }]);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const msg =
        err.status === 429
          ? "AI is busy, try again in a moment"
          : err.message || "Failed to process chat";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (recommendation) {
      navigation.navigate("MainTabs", {
        screen: "GoalsTab",
        params: { prefill: recommendation },
      } as never);
    }
  };

  return { messages, loading, recommendation, sendMessage, confirm };
}
