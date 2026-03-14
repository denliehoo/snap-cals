import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User } from "@snap-cals/shared";
import { api, setToken } from "../services/api";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
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
        set({ token, user: JSON.parse(userJson), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const { data } = await api.login(email, password);
      setToken(data.token);
      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));
      set({ token: data.token, user: data.user });
    } catch (e: any) {
      set({ error: e.message || "Login failed" });
      throw e;
    }
  },

  signup: async (email, password) => {
    set({ error: null });
    try {
      const { data } = await api.signup(email, password);
      setToken(data.token);
      await SecureStore.setItemAsync("token", data.token);
      await SecureStore.setItemAsync("user", JSON.stringify(data.user));
      set({ token: data.token, user: data.user });
    } catch (e: any) {
      set({ error: e.message || "Signup failed" });
      throw e;
    }
  },

  logout: async () => {
    setToken(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    set({ token: null, user: null });
  },
}));
