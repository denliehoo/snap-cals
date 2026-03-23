import { SubscriptionTier } from "@snap-cals/shared";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import { useUsageStore } from "@/stores/usage.store";

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_API_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_API_KEY,
}) ?? "";

function tierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  return info.entitlements.active.pro ? SubscriptionTier.PRO : SubscriptionTier.FREE;
}

export function initPurchases() {
  if (!API_KEY) return;
  Purchases.configure({ apiKey: API_KEY });
}

export async function identifyUser(userId: string) {
  if (!API_KEY) return;
  await Purchases.logIn(userId);
}

export async function logoutPurchases() {
  if (!API_KEY) return;
  await Purchases.logOut();
}

export function usePurchasesListener() {
  const setTier = useUsageStore((s) => s.setTier);
  const fetchUsage = useUsageStore((s) => s.fetch);

  useEffect(() => {
    if (!API_KEY) return;

    const listener = (info: CustomerInfo) => {
      setTier(tierFromCustomerInfo(info));
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") fetchUsage();
    });

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
      sub.remove();
    };
  }, [setTier, fetchUsage]);
}
