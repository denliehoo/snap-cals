# EAS OTA Updates

## Problem Statement

Currently, every code change — even a one-line bug fix or copy tweak — requires a full `eas build` and redistribution of the APK (and eventually an App Store / Play Store submission). This is slow (builds take minutes), wastes build credits, and delays getting fixes to users. EAS Update enables over-the-air (OTA) delivery of JavaScript bundle updates without rebuilding the native binary, so JS-only changes reach users within minutes.

## User Stories

1. **As a developer**, I want to push JS-only fixes and features to existing builds without running `eas build`, so I can ship updates in minutes instead of waiting for a full native build.

2. **As a developer**, I want separate update channels for preview and production builds, so I can test an OTA update on internal builds before pushing it to production users.

3. **As a user**, I want to be notified when an update has been downloaded so I can restart the app and get the latest version immediately if I choose to.

## Scope

- Install and configure `expo-updates` in the mobile app
- Add `runtimeVersion` policy (`"appVersion"`) to `app.json`
- Add `channel` configuration to `eas.json` build profiles (`preview` and `production`)
- On app launch, silently check for and download available updates in the background
- Show a snackbar with a "Restart" action button when an update has been downloaded — tapping it reloads the app with the new bundle; dismissing it applies the update on next app open
- Add convenience npm scripts for publishing updates to each channel
- Web builds are unaffected — OTA updates apply to native (iOS/Android) builds only

### Out of Scope

- CI/CD automation (e.g., GitHub Actions to auto-publish updates on merge)
- Rollback workflows — fix-forward by publishing a corrected update
- Forced/critical update flows that block the app until the user updates
- Update adoption analytics or monitoring
- Expo Go support — OTA updates only work in dev-client / production builds

## Acceptance Criteria

### Package & Configuration

- [ ] `expo-updates` is installed as a dependency in `apps/mobile`
- [ ] `app.json` includes `"runtimeVersion": { "policy": "appVersion" }` at the top level of the `expo` object
- [ ] `eas.json` `preview` build profile includes `"channel": "preview"`
- [ ] `eas.json` `production` build profile includes `"channel": "production"`
- [ ] `eas.json` `development` and `ios-simulator` build profiles do NOT have a `channel` (dev builds use the local dev server, not OTA)
- [ ] `expo-updates` is listed in the `plugins` array in `app.json` (required for native config)

### Update Check Behavior

- [ ] On every app launch (native builds only), the app checks EAS Update for a new bundle in the background
- [ ] The update check and download do not block app startup — the user sees the current bundle immediately
- [ ] If no update is available, nothing happens — no UI, no errors
- [ ] If the check fails (e.g., no network), the app continues normally with the current bundle — no error shown to the user
- [ ] Update checking does not run in development builds (Expo dev client) or on web — only in production/preview builds where `expo-updates` is active

### User Notification & Restart

- [ ] When an update has been successfully downloaded, a snackbar appears with the message "Update available" (or similar) and a "Restart" action button
- [ ] Tapping "Restart" calls `Updates.reloadAsync()` to immediately reload the app with the new bundle
- [ ] If the user dismisses the snackbar (or ignores it), the update applies automatically the next time they open the app
- [ ] The snackbar uses the existing snackbar component/pattern (may require extending it to support an action button)
- [ ] The snackbar type is `"success"` (green)

### NPM Scripts

- [ ] `apps/mobile/package.json` includes a script `update:preview` that runs `eas update --channel preview`
- [ ] `apps/mobile/package.json` includes a script `update:production` that runs `eas update --channel production`

### Web Compatibility

- [ ] The OTA update check is skipped entirely on web (no errors, no snackbar, no `expo-updates` calls)
- [ ] Web builds (`npx expo export --platform web`) continue to work as before — no regressions

### Existing Functionality

- [ ] All existing app functionality is unaffected — auth, food logging, AI, settings, etc.
- [ ] The app continues to work normally when no OTA update is available
- [ ] Dev builds (`expo start`, dev client) continue to work as before — `expo-updates` does not interfere with the dev server

## Data Model Changes

None.

## API Changes

None.

## UI/UX Notes

- The snackbar currently supports `show(message, type)` with no action button. This feature requires extending the snackbar to support an optional action (label + callback). The action button should appear inline in the snackbar, styled consistently with the existing design (e.g., bold/underlined text or a small button in `textOnPrimary` color).
- The snackbar auto-dismiss timer (currently 3 seconds) may need to be longer (or disabled) for the update notification so the user has time to read and tap "Restart". Consider 8–10 seconds, or no auto-dismiss for this specific notification.
- The update check + download happens silently. The snackbar only appears after the download is complete — the user is never shown a progress indicator or "checking for updates" state.
- No "Check for updates" button in Settings for v1. This can be added later if needed.

## Developer Workflow

After this feature is set up, the workflow for shipping a JS-only change is:

1. Make code changes, commit, push
2. Run `pnpm update:preview` (from `apps/mobile`) to publish to the preview channel
3. Open a preview build → app downloads the update on launch → snackbar appears → tap Restart
4. Verify the fix on the preview build
5. Run `pnpm update:production` to publish to the production channel
6. Production builds receive the update on next launch

For native changes (new plugins, SDK bump, etc.): bump `version` in `app.json`, run `eas build`, then resume OTA workflow targeting the new version.

## Risks & Dependencies

- **New native module:** `expo-updates` is a native module. After installing it, a new `eas build` is required before OTA updates can work. Existing builds (made before this change) will not receive OTA updates.
- **Runtime version mismatch:** If `version` in `app.json` is bumped without doing a new `eas build`, OTA updates targeting the new version will have no builds to deliver to. The developer must remember: bump version → build → then update.
- **Snackbar extension:** The current snackbar component does not support action buttons. This needs to be extended, which touches a shared component used across the app. Low risk but worth noting.
- **Expo Go:** `expo-updates` does not work in Expo Go. Development and testing of the OTA flow requires a dev-client build (`eas build --profile development`). The update check code must gracefully no-op in environments where `expo-updates` is not active.
