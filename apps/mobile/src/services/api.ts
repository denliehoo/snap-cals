import {
  ApiResponse,
  AuthResponse,
  FoodEntry,
  Goal,
  CreateFoodEntryRequest,
  UpdateFoodEntryRequest,
  UpsertGoalRequest,
} from "@snap-cals/shared";

const API_URL = __DEV__ ? "http://localhost:3000/api" : "http://localhost:3000/api";

let authToken: string | null = null;

export const setToken = (token: string | null) => {
  authToken = token;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await res.json();
  if (!res.ok) throw { status: res.status, ...body };
  return body;
}

export const api = {
  signup: (email: string, password: string) =>
    request<ApiResponse<AuthResponse>>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<ApiResponse<AuthResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  createEntry: (data: CreateFoodEntryRequest) =>
    request<ApiResponse<FoodEntry>>("/entries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getEntries: (date: string) =>
    request<ApiResponse<FoodEntry[]>>(`/entries?date=${date}`),
  updateEntry: (id: string, data: UpdateFoodEntryRequest) =>
    request<ApiResponse<FoodEntry>>(`/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEntry: (id: string) =>
    request<ApiResponse<void>>(`/entries/${id}`, { method: "DELETE" }),

  getGoals: () =>
    request<ApiResponse<Goal>>("/goals"),
  upsertGoals: (data: UpsertGoalRequest) =>
    request<ApiResponse<Goal>>("/goals", { method: "PUT", body: JSON.stringify(data) }),
};
