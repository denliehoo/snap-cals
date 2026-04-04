# Voice Logging

## Problem Statement

Logging food by typing on a phone is slow and awkward — especially when your hands are full, greasy, or you're on the go. Users should be able to tap a mic button, say what they ate (e.g., "two eggs and toast with butter"), and have the transcribed text populate the input field ready for AI estimation. This removes friction from the most common logging flow without requiring any backend changes.

## User Stories

1. **As a user on the AI Assist screen (initial input)**, I want to tap a microphone button, speak my food description, and see the transcribed text appear in the text input so I can send it to the AI without typing.

2. **As a user in AI chat mode (reply input)**, I want to tap a microphone button next to the reply field, speak my response, and see the transcribed text appear in the reply input so I can continue the conversation hands-free.

3. **As a user who denied microphone permission**, I want a clear prompt explaining why the permission is needed and a way to open Settings to fix it, so I'm not stuck at a dead end.

4. **As a user who speaks a long food description**, I want the recording to auto-stop after 30 seconds so I don't accidentally record forever, and I want the transcription to respect the field's character limit.

## Acceptance Criteria

### Library & Setup

- [ ] `expo-speech-recognition` is added as a dependency to the mobile app
- [ ] The Expo config plugin for `expo-speech-recognition` is added to `app.json` plugins with appropriate permission messages for microphone and speech recognition
- [ ] The feature requires a dev build (`expo-dev-client`) — does not work in Expo Go

### AI Assist Screen — Initial Input Mode

- [ ] A microphone icon button appears next to the existing camera button in the input row
- [ ] Tapping the mic button requests microphone (and speech recognition on iOS) permissions if not yet granted
- [ ] If permissions are granted, speech recognition starts with `lang: "en-US"` and `interimResults: true`
- [ ] While recording, the mic button visually changes to indicate active recording (e.g., different icon such as `stop-circle` or color change to `colors.error`)
- [ ] While recording, interim (partial) transcription results appear in the text input in real-time so the user can see what's being recognized
- [ ] Recording auto-stops after 30 seconds if the user hasn't manually stopped it
- [ ] Tapping the mic button again (while recording) stops recognition and keeps the final transcribed text in the input
- [ ] The transcribed text is truncated to `AI_DESCRIPTION_MAX_LENGTH` (200 chars) — text beyond the limit is silently dropped
- [ ] After transcription completes, the text input is populated but NOT auto-submitted — the user must tap "Estimate" themselves
- [ ] The mic button is disabled while an AI estimation is loading
- [ ] The mic button is disabled while recording is already active (prevent double-tap race conditions) — only the stop action is available during recording
- [ ] If speech recognition returns no results (silence / no speech detected), the text input remains unchanged and no error is shown

### AI Assist Screen — Chat Mode (Reply Input)

- [ ] A microphone icon button appears next to the Send button in the chat reply input row
- [ ] Behavior is identical to the initial input mode: tap to start, tap to stop, interim results shown, auto-stop at 30 seconds
- [ ] The transcribed text is truncated to `AI_CHAT_REPLY_MAX_LENGTH` (300 chars)
- [ ] After transcription completes, the reply input is populated but NOT auto-submitted — the user must tap "Send" themselves
- [ ] The mic button is disabled while a chat message is loading
- [ ] The mic button is disabled while recording is already active — only the stop action is available

### Permissions

- [ ] First tap on the mic triggers the native OS permission dialog (microphone on both platforms, plus speech recognition on iOS)
- [ ] If the user grants permission, recording starts immediately
- [ ] If the user denies permission (or has previously denied it and `canAskAgain` is false), an Alert is shown with:
  - Title: "Microphone Access Required"
  - Message: "Voice input needs microphone access. Please enable it in Settings."
  - Buttons: "Cancel" (dismisses) and "Open Settings" (calls `Linking.openSettings()`)
- [ ] No snackbar is shown for permission denial — the Alert is sufficient
- [ ] If speech recognition is unavailable on the device (`isRecognitionAvailable()` returns false), the mic button is hidden entirely

### Recording Behavior

- [ ] Speech recognition uses `continuous: false` (single utterance mode — stops after the user finishes speaking or after silence)
- [ ] `interimResults: true` is enabled so partial results appear in real-time
- [ ] A 30-second timeout is enforced client-side — if the `end` event hasn't fired within 30 seconds of starting, `abort()` is called and whatever has been transcribed so far is kept
- [ ] If the user navigates away from the AI Assist screen while recording, recognition is aborted and cleaned up (no orphaned listeners)
- [ ] Recording does not interfere with the image picker — user can attach an image AND use voice input in the same session

### Shared Constants

- [ ] `VOICE_RECORDING_MAX_DURATION_MS = 30_000` is added to `@snap-cals/shared` constants

## Data Model Changes

None. Voice logging is entirely a frontend feature — transcribed text feeds into the existing AI estimation pipeline.

## API Changes

None. The transcribed text is submitted to the existing `/api/ai/estimate` or `/api/ai/chat` endpoints as a normal text description.

## UI/UX Notes

### Mic Button Placement — Initial Input Mode

The input row currently has: `[TextInput] [CameraButton]`. With voice logging it becomes: `[TextInput] [MicButton] [CameraButton]`. The mic and camera buttons are the same size and style (icon buttons with border). The mic icon is `mic-outline` (Ionicons) when idle and `stop-circle` (Ionicons) when recording, with the icon color changing to `colors.error` during recording to clearly signal active state.

### Mic Button Placement — Chat Reply Input

The chat reply row currently has: `[TextInput] [SendButton]`. With voice logging it becomes: `[TextInput] [MicButton] [SendButton]`. The mic button uses the same icon/color treatment as the initial input mode.

### Recording Indicator

While recording, the mic button icon changes to a stop icon with error color. No additional UI elements (waveforms, timers, overlays) are needed for v1 — keep it simple. The interim text appearing in real-time in the input field is sufficient feedback that recording is working.

### Character Limit Handling

When transcribed text exceeds the field's max length, it is silently truncated (`.slice(0, maxLength)`). The existing character count indicator (which appears at 80% of the limit) will naturally show up if the transcription is long, giving the user visual feedback that they're near/at the limit.

### Interaction with Existing Features

- Voice input and image input are independent — a user can attach a photo AND dictate a description
- Voice input and discussion mode toggle are independent — voice works in both one-shot and chat modes
- The transcribed text is editable after dictation — the user can fix typos or add details before submitting

## Risks & Dependencies

- **Dev build required**: `expo-speech-recognition` is a native module and requires `expo-dev-client` / EAS Build. This is already the case for the app (due to `react-native-purchases`), so no new constraint.
- **Speech recognition accuracy**: On-device recognition quality varies by device and environment. Food names, especially non-English ones (e.g., "char kway teow", "nasi lemak"), may not transcribe well. This is acceptable for v1 — the user can always edit the text before submitting. Future improvement: add `contextualStrings` with common food terms to improve accuracy.
- **Android beep sound**: Android plays a beep when speech recognition starts/stops. This can be mitigated by using `continuous: true` mode, but that changes the recognition behavior. For v1, accept the beep with `continuous: false` — it's a minor UX annoyance, not a blocker.
- **iOS audio session**: `expo-speech-recognition` modifies the iOS audio session category when recording. This shouldn't be an issue since the app doesn't play audio, but worth noting.
- **Platform availability**: Speech recognition requires Google Speech Services on Android and Siri on iOS. If unavailable, the mic button is hidden — the feature degrades gracefully.
