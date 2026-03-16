export enum MealType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SNACK = "SNACK",
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface FoodEntry {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: MealType;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

// Auth
export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Food Entries
export interface CreateFoodEntryRequest {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: MealType;
  date: string;
}

export type UpdateFoodEntryRequest = Partial<CreateFoodEntryRequest>;

// Goals
export interface UpsertGoalRequest {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// AI Chat limits
export const AI_DESCRIPTION_MAX_LENGTH = 200;
export const AI_CHAT_REPLY_MAX_LENGTH = 300;

// AI Estimate
export interface AiEstimateRequest {
  description: string;
}

export interface AiEstimateResponse {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

// AI Chat
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiChatRequest {
  messages: ChatMessage[];
  forceEstimate?: boolean;
}

export interface AiChatResponse {
  message: string;
  estimate?: AiEstimateResponse;
}
