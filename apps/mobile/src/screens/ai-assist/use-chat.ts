import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChatMessage, AiEstimateResponse, ImageData } from "@snap-cals/shared";
import { api } from "@/services/api";
import { MainStackParamList } from "@/navigation";

export function useChat() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<AiEstimateResponse | null>(null);
  const [storedImage, setStoredImage] = useState<ImageData | undefined>();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const sendMessage = async (text: string, forceEstimate = false, image?: ImageData, uri?: string) => {
    const updated: ChatMessage[] = text
      ? [...messages, { role: "user", content: text }]
      : messages;
    if (text) setMessages(updated);
    if (image) {
      setStoredImage(image);
      if (uri) setImageUri(uri);
    }
    const imageToSend = image ?? storedImage;
    setLoading(true);
    try {
      const { data } = await api.chatNutrition({ messages: updated, forceEstimate, image: imageToSend });
      let content = data.message;
      if (data.estimate) {
        const e = data.estimate;
        content += `\n\n${e.name} (${e.servingSize})\nCalories: ${e.calories} kcal\nProtein: ${e.protein}g · Carbs: ${e.carbs}g · Fat: ${e.fat}g`;
        setEstimate(e);
      }
      setMessages([...updated, { role: "assistant", content }]);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const msg = err.status === 429 ? "AI is busy, try again in a moment" : err.message || "Failed to process chat";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (estimate) navigation.navigate("EntryForm", { prefill: estimate });
  };

  return { messages, loading, estimate, imageUri, sendMessage, confirm };
}
