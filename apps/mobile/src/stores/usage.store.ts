import {
  DEFAULT_FREE_DAILY_AI_LIMIT,
  SubscriptionTier,
} from "@snap-cals/shared";
import { create } from "zustand";
import { api } from "@/services/api";

interface UsageState {
  used: number;
  limit: number;
  resetsAt: string;
  tier: SubscriptionTier;
  fetch: () => Promise<void>;
  isAtLimit: () => boolean;
  setTier: (tier: SubscriptionTier) => void;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  used: 0,
  limit: DEFAULT_FREE_DAILY_AI_LIMIT,
  resetsAt: "",
  tier: SubscriptionTier.FREE,

  fetch: async () => {
    try {
      const { data } = await api.getUsage();
      set({
        used: data.used,
        limit: data.limit,
        resetsAt: data.resetsAt,
        tier: data.tier,
      });
    } catch {
      // silently fail — usage display is non-critical
    }
  },

  isAtLimit: () => {
    const { tier, used, limit } = get();
    return tier === SubscriptionTier.FREE && used >= limit;
  },

  setTier: (tier) => set({ tier }),
}));
