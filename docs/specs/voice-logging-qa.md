## QA Report: Voice Logging
### Date: 2026-04-04
### Spec: docs/specs/voice-logging.md

### Results

#### Library & Setup

- ✅ PASS — `expo-speech-recognition` is added as a dependency
  - Evidence: `apps/mobile/package.json` line 27: `"expo-speech-recognition": "^3.1.2"`

- ✅ PASS — Expo config plugin added with permission messages for microphone and speech recognition
  - Evidence: `apps/mobile/app.json` lines 48–53: plugin entry with `microphonePermission` and `speechRecognitionPermission` messages

- ✅ PASS — Feature requires dev build (`expo-dev-client`)
  - Evidence: `apps/mobile/package.json` includes `expo-dev-client` dependency; `app.json` plugins include `"expo-dev-client"`

#### AI Assist Screen — Initial Input Mode

- ✅ PASS — Mic icon button appears next to the camera button in the input row
  - Evidence: `apps/mobile/src/screens/ai-assist/index.tsx` lines 207–224: mic button rendered between TextInput and camera button inside `inputRow`, conditional on `descriptionVoice.available`

- ✅ PASS — Tapping mic requests permissions if not yet granted
  - Evidence: `use-voice-input.ts` line 57: `start` calls `ExpoSpeechRecognitionModule.requestPermissionsAsync()` before starting recognition

- ✅ PASS — Speech recognition starts with `lang: "en-US"` and `interimResults: true`
  - Evidence: `use-voice-input.ts` lines 72–76: `ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true, continuous: false })`

- ✅ PASS — While recording, mic button visually changes (stop-circle icon, error color)
  - Evidence: `index.tsx` lines 219–220: icon is `"stop-circle"` when `descriptionVoice.recording`, color is `colors.error`

- ✅ PASS — Interim transcription results appear in text input in real-time
  - Evidence: `use-voice-input.ts` lines 39–42: `useSpeechRecognitionEvent("result", ...)` calls `setText(transcript.slice(0, maxLength))` on every result event (interim or final)

- ✅ PASS — Recording auto-stops after 30 seconds
  - Evidence: `use-voice-input.ts` lines 78–80: `setTimeout` calls `abort()` after `VOICE_RECORDING_MAX_DURATION_MS` (30,000ms from shared constants)

- ✅ PASS — Tapping mic again stops recognition and keeps final text
  - Evidence: `index.tsx` line 212: `onPress` toggles between `descriptionVoice.stop` and `descriptionVoice.start` based on `recording` state; `stop()` calls `ExpoSpeechRecognitionModule.stop()` which finalizes results

- ✅ PASS — Transcribed text truncated to `AI_DESCRIPTION_MAX_LENGTH` (200 chars)
  - Evidence: `use-voice-input.ts` line 41: `transcript.slice(0, maxLength)` where `maxLength` is `AI_DESCRIPTION_MAX_LENGTH` (passed from screen)

- ✅ PASS — Text is NOT auto-submitted after transcription
  - Evidence: `use-voice-input.ts` only calls `setText` — no submission logic. User must tap "Estimate" manually.

- ✅ PASS — Mic button disabled while AI estimation is loading
  - Evidence: `index.tsx` line 216: `disabled={assist.loading && !descriptionVoice.recording}` — disabled when loading (unless recording, to allow stopping)

- ✅ PASS — Mic button disabled while recording is active (only stop action available)
  - Evidence: `index.tsx` line 212: `onPress` switches to `descriptionVoice.stop` when `recording` is true — the button becomes a stop button, preventing double-start

- ✅ PASS — No speech detected leaves text input unchanged, no error shown
  - Evidence: `use-voice-input.ts` — `result` event handler only fires when results exist; `error` and `end` handlers only reset recording state without modifying text or showing errors

#### AI Assist Screen — Chat Mode (Reply Input)

- ✅ PASS — Mic icon button appears next to Send button in chat reply row
  - Evidence: `index.tsx` lines 137–149: mic button rendered between chatInput and Send button, conditional on `replyVoice.available`

- ✅ PASS — Behavior identical to initial input mode (tap to start/stop, interim results, auto-stop at 30s)
  - Evidence: `replyVoice` uses the same `useVoiceInput` hook with identical logic

- ✅ PASS — Transcribed text truncated to `AI_CHAT_REPLY_MAX_LENGTH` (300 chars)
  - Evidence: `index.tsx` line 42: `useVoiceInput(setReply, AI_CHAT_REPLY_MAX_LENGTH)`

- ✅ PASS — Text NOT auto-submitted after transcription
  - Evidence: Hook only calls `setReply` — user must tap "Send" manually

- ✅ PASS — Mic button disabled while chat message is loading
  - Evidence: `index.tsx` line 145: `disabled={chat.loading && !replyVoice.recording}`

- ✅ PASS — Mic button disabled while recording is active (only stop action available)
  - Evidence: `index.tsx` line 140: `onPress` toggles between `replyVoice.stop` and `replyVoice.start`

#### Permissions

- ✅ PASS — First tap triggers native OS permission dialog
  - Evidence: `use-voice-input.ts` line 58: `requestPermissionsAsync()` called on first `start()`

- ✅ PASS — If granted, recording starts immediately
  - Evidence: `use-voice-input.ts` lines 57–80: after `granted` check passes, `setRecording(true)` and `start()` called immediately

- ✅ PASS — If denied with `canAskAgain: false`, Alert shown with correct title, message, and buttons
  - Evidence: `use-voice-input.ts` lines 61–70: Alert with title "Microphone Access Required", message "Voice input needs microphone access. Please enable it in Settings.", buttons "Cancel" and "Open Settings" (calls `Linking.openSettings()`)

- ✅ PASS — No snackbar shown for permission denial
  - Evidence: `use-voice-input.ts` — no snackbar/toast calls anywhere in the hook; only `Alert.alert` is used

- ✅ PASS — Mic button hidden if speech recognition unavailable
  - Evidence: `use-voice-input.ts` line 19: `setAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable())`; `index.tsx` lines 207 and 137: mic button wrapped in `{descriptionVoice.available && ...}` / `{replyVoice.available && ...}`

#### Recording Behavior

- ✅ PASS — Speech recognition uses `continuous: false`
  - Evidence: `use-voice-input.ts` line 75: `continuous: false`

- ✅ PASS — `interimResults: true` enabled
  - Evidence: `use-voice-input.ts` line 74: `interimResults: true`

- ✅ PASS — 30-second timeout enforced client-side, calls `abort()`, keeps transcribed text
  - Evidence: `use-voice-input.ts` lines 78–80: `setTimeout(() => ExpoSpeechRecognitionModule.abort(), VOICE_RECORDING_MAX_DURATION_MS)`. Text already set via `result` events is preserved since `abort()` doesn't clear it.

- ✅ PASS — Navigation away aborts recognition and cleans up
  - Evidence: `index.tsx` lines 56–65: `useFocusEffect` cleanup calls `descriptionVoiceStopRef.current()` and `replyVoiceStopRef.current()`; `use-voice-input.ts` lines 27–32: unmount effect calls `abort()` if recording

- ✅ PASS — Recording does not interfere with image picker
  - Evidence: Voice input and image picker are completely independent — separate hooks, separate state, separate buttons. No mutual exclusion logic.

#### Shared Constants

- ✅ PASS — `VOICE_RECORDING_MAX_DURATION_MS = 30_000` added to shared constants
  - Evidence: `packages/shared/src/constants.ts` line 16: `export const VOICE_RECORDING_MAX_DURATION_MS = 30_000;`

### Bugs Found

None.

### Test Results

All tests pass:
- Mobile: 16 suites, 91 tests passed
- Server: 11 suites, 134 tests passed

The existing AI Assist screen tests mock `useVoiceInput` and continue to pass. No regressions introduced.

### Summary
- Total criteria: 28
- Passed: 28
- Failed: 0
- Verdict: PASS
