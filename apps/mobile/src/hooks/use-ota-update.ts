import * as Updates from "expo-updates";
import { useEffect } from "react";
import { useSnackbar } from "@/components/snackbar";

export function useOtaUpdate() {
  const { show } = useSnackbar();

  useEffect(() => {
    if (!Updates.isEnabled) return;

    let cancelled = false;

    async function checkForUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (cancelled || !update.isAvailable) return;

        const result = await Updates.fetchUpdateAsync();
        if (cancelled || !result.isNew) return;

        show("Update available", "success", {
          duration: 10000,
          action: {
            label: "Restart",
            onPress: () => Updates.reloadAsync(),
          },
        });
      } catch (_e: unknown) {
        // Silently ignore — network errors, no update, etc.
      }
    }

    checkForUpdate();

    return () => {
      cancelled = true;
    };
  }, [show]);
}
