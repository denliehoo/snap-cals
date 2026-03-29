import type { WeightUnit } from "@snap-cals/shared";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const DISCUSSION_KEY = "discussion_mode_default";
const WEIGHT_UNIT_KEY = "weight_unit";

interface SettingsState {
  discussionMode: boolean;
  weightUnit: WeightUnit;
  toggleDiscussionMode: () => void;
  setWeightUnit: (unit: WeightUnit) => void;
  restore: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  discussionMode: false,
  weightUnit: "kg",

  toggleDiscussionMode: () => {
    const next = !get().discussionMode;
    set({ discussionMode: next });
    SecureStore.setItemAsync(DISCUSSION_KEY, JSON.stringify(next));
  },

  setWeightUnit: (unit: WeightUnit) => {
    set({ weightUnit: unit });
    SecureStore.setItemAsync(WEIGHT_UNIT_KEY, unit);
  },

  restore: async () => {
    try {
      const [disc, wu] = await Promise.all([
        SecureStore.getItemAsync(DISCUSSION_KEY),
        SecureStore.getItemAsync(WEIGHT_UNIT_KEY),
      ]);
      const updates: Partial<SettingsState> = {};
      if (disc !== null) updates.discussionMode = JSON.parse(disc);
      if (wu === "kg" || wu === "lbs") updates.weightUnit = wu;
      if (Object.keys(updates).length) set(updates);
    } catch {
      // keep defaults
    }
  },
}));
