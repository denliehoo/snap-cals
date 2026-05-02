import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * On web, if a stack screen is loaded directly (refresh/bookmark) without
 * navigation history, redirect to the fallback screen. This prevents broken
 * states where params passed in-memory are lost.
 *
 * Returns true if redirecting (caller should render null).
 */
export function useWebRedirect(fallback = "MainTabs") {
  const navigation = useNavigation();
  const shouldRedirect = Platform.OS === "web" && !navigation.canGoBack();

  useEffect(() => {
    if (shouldRedirect) {
      navigation.reset({ index: 0, routes: [{ name: fallback as never }] });
    }
  }, [shouldRedirect, navigation, fallback]);

  return shouldRedirect;
}
