export enum MealType {
  BREAKFAST = "BREAKFAST",
  LUNCH = "LUNCH",
  DINNER = "DINNER",
  SNACK = "SNACK",
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
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

export interface AuthPendingResponse {
  userId: string;
  emailVerified: false;
}

export interface VerifyEmailRequest {
  userId: string;
  code: string;
}

export interface ResendVerificationRequest {
  userId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface GoogleAuthRequest {
  idToken?: string;
  code?: string;
  clientId?: string;
  redirectUri?: string;
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

// Favorites
export interface FavoriteFoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: MealType;
  createdAt: string;
}

export interface CreateFavoriteFoodRequest {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: MealType;
}

export interface RecentFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  mealType: MealType;
}

// AI Chat limits
export const AI_DESCRIPTION_MAX_LENGTH = 200;
export const AI_CHAT_REPLY_MAX_LENGTH = 300;

// Image
export interface ImageData {
  base64: string;
  mimeType: string;
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB base64 string length limit

// AI Estimate
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
}

// AI Chat
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

// AI Goal Coach
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
