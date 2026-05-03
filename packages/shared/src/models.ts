import type { MealType, SubscriptionTier, UserStatus } from "./enums";

export interface User {
  id: string;
  email: string;
  status: UserStatus;
  subscriptionTier: SubscriptionTier;
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
  source: string | null;
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

export interface AiUsageResponse {
  used: number;
  limit: number;
  resetsAt: string;
  tier: SubscriptionTier;
}

export interface FavoriteFoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  source: string | null;
  mealType: MealType;
  createdAt: string;
}

export interface RecentFoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  source: string | null;
  mealType: MealType;
}

export type WeightUnit = "kg" | "lbs";

export interface WeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  weightLbs: number;
  note: string | null;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}
