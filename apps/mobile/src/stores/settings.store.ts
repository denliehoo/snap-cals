import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const STORAGE_KEY = "discussion_mode_default";

interface SettingsState {
  discussionMode: boolean;
  toggleDiscussionMode: () => void;
  restore: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  discussionMode: false,

  toggleDiscussionMode: () => {
    const next = !get().discussionMode;
    set({ discussionMode: next });
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
  },

  restore: async () => {
    try {
      const value = await SecureStore.getItemAsync(STORAGE_KEY);
      if (value !== null) {
        set({ discussionMode: JSON.parse(value) });
      }
    } catch {
      // keep default
    }
  },
}));
