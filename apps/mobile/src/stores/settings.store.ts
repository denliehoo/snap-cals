import type { WeightUnit } from "@snap-cals/shared";
import { create } from "zustand";
import { getItem, setItem } from "@/utils/storage";

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
    setItem(DISCUSSION_KEY, JSON.stringify(next));
  },

  setWeightUnit: (unit: WeightUnit) => {
    set({ weightUnit: unit });
    setItem(WEIGHT_UNIT_KEY, unit);
  },

  restore: async () => {
    try {
      const [disc, wu] = await Promise.all([
        getItem(DISCUSSION_KEY),
        getItem(WEIGHT_UNIT_KEY),
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
