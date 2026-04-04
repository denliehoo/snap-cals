import { VOICE_RECORDING_MAX_DURATION_MS } from "@snap-cals/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";

// Lazy-load to avoid crashing in Expo Go where the native module isn't available
let SpeechModule:
  | typeof import("expo-speech-recognition").ExpoSpeechRecognitionModule
  | null = null;
let useEvent:
  | typeof import("expo-speech-recognition").useSpeechRecognitionEvent
  | null = null;

try {
  const mod = require("expo-speech-recognition");
  SpeechModule = mod.ExpoSpeechRecognitionModule;
  useEvent = mod.useSpeechRecognitionEvent;
} catch {
  // Native module not available (Expo Go) — voice input will be hidden
}

// No-op hook that matches useSpeechRecognitionEvent signature
const noopEvent: NonNullable<typeof useEvent> = () => {};

export function useVoiceInput(
  setText: (text: string) => void,
  maxLength: number,
) {
  const [recording, setRecording] = useState(false);
  const [available, setAvailable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const useSpeechEvent = useEvent ?? noopEvent;

  useEffect(() => {
    setAvailable(SpeechModule?.isRecognitionAvailable() ?? false);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      if (recording) {
        SpeechModule?.abort();
      }
    };
  }, [recording, clearTimer]);

  useSpeechEvent("result", (event) => {
    const transcript = event.results[0]?.transcript ?? "";
    setText(transcript.slice(0, maxLength));
  });

  useSpeechEvent("end", () => {
    setRecording(false);
    clearTimer();
  });

  useSpeechEvent("error", () => {
    setRecording(false);
    clearTimer();
  });

  const start = useCallback(async () => {
    if (!SpeechModule) return;

    const { granted, canAskAgain } =
      await SpeechModule.requestPermissionsAsync();

    if (!granted) {
      if (!canAskAgain) {
        Alert.alert(
          "Microphone Access Required",
          "Voice input needs microphone access. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }

    setRecording(true);
    SpeechModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });

    timerRef.current = setTimeout(() => {
      SpeechModule?.abort();
    }, VOICE_RECORDING_MAX_DURATION_MS);
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    SpeechModule?.stop();
  }, [clearTimer]);

  return { recording, available, start, stop };
}
