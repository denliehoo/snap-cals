import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorMessage } from "@/utils/error";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export function useGoogleAuth(onError: (msg: string) => void) {
  const googleLogin = useAuthStore((s) => s.googleLogin);
  const [loading, setLoading] = useState(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const clientId =
    Platform.OS === "android"
      ? (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "")
      : (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "");
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "snapcals" });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      responseType: AuthSession.ResponseType.Code,
      scopes: ["openid", "email", "profile"],
      redirectUri,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type !== "success") return;
    const code = response.params?.code;
    if (!code) return;

    setLoading(true);
    googleLogin({ code, clientId, redirectUri })
      .catch((e: unknown) => {
        onErrorRef.current(getErrorMessage(e, "Google login failed"));
      })
      .finally(() => setLoading(false));
  }, [response, googleLogin, clientId, redirectUri]);

  const trigger = useCallback(() => {
    if (request) promptAsync();
  }, [request, promptAsync]);

  return { trigger, loading, ready: !!request };
}
