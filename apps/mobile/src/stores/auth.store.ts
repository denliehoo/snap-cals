import type {
  AuthPendingResponse,
  AuthResponse,
  User,
} from "@snap-cals/shared";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { identifyUser, logoutPurchases } from "@/hooks/use-purchases";
import { api, setOnUnauthorized, setToken } from "@/services/api";
import { getErrorMessage } from "@/utils/error";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  setAuth: (token: string, user: User) => Promise<void>;
  googleLogin: (params: {
    code: string;
    clientId: string;
    redirectUri: string;
  }) => Promise<void>;
}

function isAuthResponse(
  data: AuthResponse | AuthPendingResponse,
): data is AuthResponse {
  return "token" in data;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  error: null,

  restore: async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      const userJson = await SecureStore.getItemAsync("user");
      if (token && userJson) {
        setToken(token);
        const user = JSON.parse(userJson);
        set({ token, user, isLoading: false });
        identifyUser(user.id).catch(() => {});
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
    setOnUnauthorized(() => get().logout());
  },

  setAuth: async (token: string, user: User) => {
    setToken(token);
    await SecureStore.setItemAsync("token", token);
    await SecureStore.setItemAsync("user", JSON.stringify(user));
    set({ token, user });
    identifyUser(user.id).catch(() => {});
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const { data } = await api.login(email, password);
      if (isAuthResponse(data)) {
        await get().setAuth(data.token, data.user);
        return null;
      }
      // Needs email verification
      return data.userId;
    } catch (e: unknown) {
      set({ error: getErrorMessage(e, "Login failed") });
      throw e;
    }
  },

  signup: async (email, password) => {
    set({ error: null });
    try {
      const { data } = await api.signup(email, password);
      return data.userId;
    } catch (e: unknown) {
      set({ error: getErrorMessage(e, "Signup failed") });
      throw e;
    }
  },

  googleLogin: async (params) => {
    set({ error: null });
    try {
      const { data } = await api.googleAuth(params);
      await get().setAuth(data.token, data.user);
    } catch (e: unknown) {
      set({ error: getErrorMessage(e, "Google login failed") });
      throw e;
    }
  },

  logout: async () => {
    setToken(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    logoutPurchases().catch(() => {});
    set({ token: null, user: null });
  },
}));
