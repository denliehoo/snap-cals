import type {
  AiChatRequest,
  AiChatResponse,
  AiEstimateResponse,
  AiUsageResponse,
  ApiResponse,
  AuthPendingResponse,
  AuthResponse,
  CreateFavoriteFoodRequest,
  CreateFoodEntryRequest,
  FavoriteFoodItem,
  FoodEntry,
  Goal,
  GoalCoachRequest,
  GoalCoachResponse,
  ImageData,
  RecentFoodItem,
  UpdateFoodEntryRequest,
  UpsertGoalRequest,
} from "@snap-cals/shared";

import { Platform } from "react-native";

// Note: If want to test against local server in android app from a physical device using the Expo Go app, need to use the local network IP address instead. Can just use the address below for android:
const DEV_HOST = Platform.OS === "android" ? "192.168.1.43" : "localhost";
// const DEV_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const DEV_URL = `http://${DEV_HOST}:3000/api`;
const API_URL =
  process.env.EXPO_PUBLIC_USE_LOCAL === "1"
    ? DEV_URL
    : process.env.EXPO_PUBLIC_API_URL || DEV_URL;

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (token: string | null) => {
  authToken = token;
};

export const setOnUnauthorized = (handler: () => void) => {
  onUnauthorized = handler;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Api-Key": process.env.EXPO_PUBLIC_API_KEY ?? "",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await res.json();
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw { status: res.status, ...body };
  }
  return body;
}

export const api = {
  signup: (email: string, password: string) =>
    request<ApiResponse<AuthPendingResponse>>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<ApiResponse<AuthResponse | AuthPendingResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyEmail: (userId: string, code: string) =>
    request<ApiResponse<AuthResponse>>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ userId, code }),
    }),
  resendVerification: (userId: string) =>
    request<{ message: string }>("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, code, newPassword }),
    }),
  googleAuth: (params: {
    code: string;
    clientId: string;
    redirectUri: string;
  }) =>
    request<ApiResponse<AuthResponse>>("/auth/google", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  createEntry: (data: CreateFoodEntryRequest) =>
    request<ApiResponse<FoodEntry>>("/entries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getEntries: (date: string) =>
    request<ApiResponse<FoodEntry[]>>(`/entries?date=${date}`),
  getWeekEntries: (startDate: string) =>
    request<ApiResponse<FoodEntry[]>>(`/entries/week?startDate=${startDate}`),
  updateEntry: (id: string, data: UpdateFoodEntryRequest) =>
    request<ApiResponse<FoodEntry>>(`/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEntry: (id: string) =>
    request<ApiResponse<void>>(`/entries/${id}`, { method: "DELETE" }),

  getGoals: () => request<ApiResponse<Goal>>("/goals"),
  upsertGoals: (data: UpsertGoalRequest) =>
    request<ApiResponse<Goal>>("/goals", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  estimateNutrition: (description: string, image?: ImageData) =>
    request<ApiResponse<AiEstimateResponse>>("/ai/estimate", {
      method: "POST",
      body: JSON.stringify({ description, image }),
    }),

  chatNutrition: (data: AiChatRequest) =>
    request<ApiResponse<AiChatResponse>>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getFavorites: () => request<ApiResponse<FavoriteFoodItem[]>>("/favorites"),
  createFavorite: (data: CreateFavoriteFoodRequest) =>
    request<ApiResponse<FavoriteFoodItem>>("/favorites", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteFavorite: (id: string) =>
    request<ApiResponse<void>>(`/favorites/${id}`, { method: "DELETE" }),
  getRecentFoods: () =>
    request<ApiResponse<RecentFoodItem[]>>("/entries/recent"),

  goalCoach: (data: GoalCoachRequest) =>
    request<ApiResponse<GoalCoachResponse>>("/ai/goal-coach", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getUsage: () => request<ApiResponse<AiUsageResponse>>("/usage"),
};
