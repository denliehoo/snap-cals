export interface ImageData {
  base64: string;
  mimeType: string;
}

export interface AiEstimateRequest {
  description: string;
  image?: ImageData;
}

export interface AiEstimateResponse {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  source?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatRequest {
  messages: ChatMessage[];
  forceEstimate?: boolean;
  image?: ImageData;
}

export interface AiChatResponse {
  message: string;
  estimate?: AiEstimateResponse;
}

export interface GoalCoachRequest {
  messages: ChatMessage[];
}

export interface GoalRecommendation {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  explanation: string;
}

export interface GoalCoachResponse {
  message: string;
  recommendation?: GoalRecommendation;
}
