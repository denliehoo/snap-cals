# QA Report: EAS OTA Updates

## Date: 2026-05-03

## Spec: docs/specs/eas-ota-updates.md

## Results

### Package & Configuration

- ✅ **`expo-updates` installed**: Listed in `apps/mobile/package.json` dependencies as `"expo-updates": "^55.0.21"`.
- ✅ **`runtimeVersion` policy**: `app.json` has `"runtimeVersion": { "policy": "appVersion" }` at the top level of the `expo` object.
- ✅ **`preview` channel**: `eas.json` `preview` profile includes `"channel": "preview"`.
- ✅ **`production` channel**: `eas.json` `production` profile includes `"channel": "production"`.
- ✅ **Dev profiles have no channel**: `development` and `ios-simulator` profiles do not have a `channel` property.
- ✅ **`expo-updates` in plugins**: `"expo-updates"` is listed in the `plugins` array in `app.json`.

### Update Check Behavior

- ✅ **Check on launch**: `useOtaUpdate()` is called in `AppContent` (`App.tsx:8`), which runs on mount. The `useEffect` in `use-ota-update.ts:7` calls `checkForUpdate()` immediately.
- ✅ **Non-blocking**: The update check is async (`async function checkForUpdate()`). The app renders `<Navigation />` immediately without waiting for the check.
- ✅ **No update → no UI**: `if (!update.isAvailable) return;` at `use-ota-update.ts:15` silently exits.
- ✅ **Network failure → silent**: Entire check is wrapped in `try/catch` (`use-ota-update.ts:22`) that catches all errors silently.
- ✅ **Skipped in dev/web**: Native hook guards with `if (!Updates.isEnabled) return;` (`use-ota-update.ts:8`). Web uses `use-ota-update.web.ts` which is a complete no-op (no `expo-updates` import).

### User Notification & Restart

- ✅ **Snackbar with "Restart"**: `show("Update available", "success", { duration: 10000, action: { label: "Restart", onPress: () => Updates.reloadAsync() } })` at `use-ota-update.ts:18-21`.
- ✅ **Restart calls `reloadAsync`**: `onPress: () => Updates.reloadAsync()` at `use-ota-update.ts:20`.
- ✅ **Dismiss → update on next open**: Snackbar auto-dismisses after 10s or on close tap. Standard `expo-updates` behavior applies the downloaded update on next app launch.
- ✅ **Snackbar extended with action button**: `snackbar.tsx` now accepts `ShowOptions` with optional `action: { label, onPress }` and `duration`. Action button renders inline (`snackbar.tsx:100-111`). Existing callers are unaffected since `options` is optional.
- ✅ **Snackbar type is "success"**: Second argument to `show()` is `"success"` (`use-ota-update.ts:18`).

### NPM Scripts

- ✅ **`update:preview` script**: `apps/mobile/package.json` has `"update:preview": "eas update --channel preview"`.
- ✅ **`update:production` script**: `apps/mobile/package.json` has `"update:production": "eas update --channel production"`.

### Web Compatibility

- ✅ **OTA skipped on web**: `use-ota-update.web.ts` is a no-op function — no `expo-updates` import, no API calls, no snackbar. Metro resolves `.web.ts` automatically on web builds.
- ✅ **Web builds unaffected**: No changes to web-specific files. `expo-updates` is only imported in the native `.ts` file, never in `.web.ts`.

### Existing Functionality

- ✅ **All tests pass**: 30 test suites, 269 tests — all passing (16 mobile, 14 server).
- ✅ **Normal operation without updates**: `Updates.isEnabled` returns `false` in dev/test environments, so the hook is a no-op during normal development.
- ✅ **Dev builds unaffected**: `if (!Updates.isEnabled) return;` ensures the hook does nothing in dev client builds.

## Bugs Found

None.

## Summary

- **Total criteria**: 20
- **Passed**: 20
- **Failed**: 0
- **Verdict**: **PASS**
