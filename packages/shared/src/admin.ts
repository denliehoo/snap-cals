export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: AdminProfile;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface CreateAdminRequest {
  email: string;
  name: string;
  password: string;
}

export interface AdminUserListResponse {
  users: AdminUserSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  subscriptionTier: string;
  createdAt: string;
  status: string;
}

export interface AdminUpdateGoalRequest {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

export interface AdminUpdateEntryRequest {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: string;
  source?: string;
  mealType?: string;
  date?: string;
}

export interface AdminUpdateUserStatusRequest {
  status: string;
}

export interface PlatformSettings {
  signupEnabled: boolean;
  freeDailyAiLimit: number;
}

export interface UpdatePlatformSettingsRequest {
  signupEnabled?: boolean;
  freeDailyAiLimit?: number;
}

export interface SignupStatusResponse {
  signupEnabled: boolean;
}
