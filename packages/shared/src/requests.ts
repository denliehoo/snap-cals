import type { MealType } from "./enums";
import type { WeightUnit } from "./models";

export interface CreateFoodEntryRequest {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  source?: string;
  mealType: MealType;
  date: string;
}

export type UpdateFoodEntryRequest = Partial<CreateFoodEntryRequest>;

export interface UpsertGoalRequest {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

export interface CreateFavoriteFoodRequest {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  source?: string;
  mealType: MealType;
}

export interface CreateWeightEntryRequest {
  weight: number;
  unit: WeightUnit;
  loggedAt: string;
  note?: string;
}

export interface UpdateWeightEntryRequest {
  weight?: number;
  unit?: WeightUnit;
  loggedAt?: string;
  note?: string;
}
