# Spec: PWA / Mobile Web Version

## Problem Statement

Publishing to the Apple App Store requires a $99/year Apple Developer Program membership. To avoid this cost while still reaching iOS users, Snap Cals needs a web-accessible version that works in mobile browsers and can be installed to the home screen as a Progressive Web App (PWA). This lets users access the full app experience from any device with a browser — no app store required.

## Motivation

- Eliminate the Apple Developer Program fee as a barrier to shipping on iOS
- Reach users on any platform (iOS, Android, desktop) via a single URL
- Maintain a single codebase in `apps/mobile` using Expo's built-in web support and `.web.tsx` file overrides for platform-specific code

## Approach

Expo SDK 55 supports web as a build target via `react-native-web`. The existing `apps/mobile` codebase will be extended — not forked — to support web. Platform-specific code uses the `.web.ts` / `.web.tsx` file extension convention (Metro and webpack automatically resolve `foo.web.tsx` over `foo.tsx` when building for web).

**This is NOT a separate app.** It is the same `apps/mobile` project, compiled for an additional platform.

## Scope — v1

### In Scope

- All screens and features that currently exist in the native app, except the exclusions below
- PWA manifest (installable to home screen, full-screen mode, app icon, splash)
- Web-compatible replacements for native-only modules (see Platform Abstraction section)
- Camera and gallery image input via browser APIs
- Responsive layout that works on mobile browsers and desktop
- Production build and static-file deployment

### Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| In-app purchases / Paywall | RevenueCat SDK is native-only; web payments (Stripe) deferred to a future phase |
| Voice logging | `expo-speech-recognition` is native-only; Web Speech API is inconsistent across browsers |
| Google OAuth | `expo-auth-session` flow differs on web; email/password auth is sufficient for v1 |
| Push notifications | Web Push API has limited Safari support; not critical for launch |
| Offline support / service worker caching | Adds complexity; online-only is acceptable for v1 |
| `expo-router` migration | Current React Navigation setup has web support; migration is a separate effort if needed later |

## User Stories

1. **As a user**, I can open Snap Cals in my phone's browser and use all core features (log food, view daily/weekly summaries, set goals, log weight) without installing a native app.
2. **As a user**, I can "Add to Home Screen" from my mobile browser and launch Snap Cals in full-screen mode like a native app.
3. **As a user**, I can sign up, log in, and reset my password on the web version using email/password.
4. **As a user**, I can use AI food estimation on the web, including taking a photo or selecting an image from my device.
5. **As a user**, I see a "Coming Soon" message on the Paywall/subscription screen instead of the native purchase flow.
6. **As a user on desktop**, I can use Snap Cals in my browser with a reasonable layout (not broken, though mobile is the primary target).

## Data Model Changes

None. The web version uses the same backend API and database as the native app.

## API Changes

None. The existing Express API serves both native and web clients. The web client sends the same `X-Api-Key` header and JWT `Authorization` header.

One consideration: the API's `DEV_HOST` logic in `services/api.ts` uses `Platform.OS` to choose between `localhost` and an Android IP. On web, `Platform.OS === "web"`, so this needs to resolve correctly (it should fall through to `localhost`, which is correct for web dev).

## Platform Abstraction — Web Overrides Needed

These modules use native APIs unavailable in browsers. Each needs a `.web.ts` / `.web.tsx` counterpart.

### 1. Secure Storage (`expo-secure-store`)

**Used in:** `auth.store.ts`, `settings.store.ts`, `theme-context.tsx`

**Web replacement:** `localStorage`

**Strategy:** Create a `utils/storage.ts` with `getItem`, `setItem`, `deleteItem` that wraps `expo-secure-store`, and a `utils/storage.web.ts` that wraps `localStorage`. All stores and contexts import from `utils/storage` — Metro/webpack resolves the correct file per platform.

> Note: `localStorage` is not encrypted like `expo-secure-store`. JWTs in `localStorage` are vulnerable to XSS. This is an accepted tradeoff for v1 — the same pattern is used by most web SPAs. A future improvement could use `httpOnly` cookies.

### 2. Image Picker (`expo-image-picker`)

**Used in:** `screens/ai-assist/use-image-picker.ts`

**Web replacement:** HTML `<input type="file" accept="image/*">` with optional `capture` attribute for camera access.

**Strategy:** Create `use-image-picker.web.ts` that uses a hidden file input element. Returns the same `PickedImage` shape (`uri`, `base64`, `mimeType`). The `pickFromCamera` function uses `capture="environment"` attribute; `pickFromGallery` omits it. Base64 conversion via `FileReader`.

### 3. RevenueCat (`react-native-purchases`)

**Used in:** `hooks/use-purchases.ts`, `screens/paywall/index.tsx`, `screens/settings/index.tsx`

**Web replacement:** No-op stubs.

**Strategy:**
- `hooks/use-purchases.web.ts` — exports no-op functions (`initPurchases`, `identifyUser`, `logoutPurchases` do nothing; `usePurchasesListener` is an empty hook)
- `screens/paywall/index.web.tsx` — a static "Coming Soon" screen explaining that subscriptions are available on the mobile app, with the same visual style (trophy icon, feature list) but a "Coming Soon" badge instead of the subscribe button
- Settings screen subscription section — on web, hide "Manage Subscription" and replace "Upgrade to Pro" with navigation to the web paywall (which shows "Coming Soon")

### 4. Voice Input (`expo-speech-recognition`)

**Used in:** `screens/ai-assist/use-voice-input.ts`

**Web replacement:** None for v1.

**Strategy:** `use-voice-input.web.ts` — returns `{ recording: false, available: false, start: noop, stop: noop }`. The mic button is already hidden when `available` is `false`, so no UI changes needed.

### 5. Date/Time Pickers (`@react-native-community/datetimepicker`)

**Used in:** `components/time-picker-modal.tsx`

**Web replacement:** HTML `<input type="time">` styled to match the app theme.

**Strategy:** `components/time-picker-modal.web.tsx` — renders a themed modal with an HTML time input. Same props interface.

### 6. Date Picker (`react-native-calendars`)

**Used in:** `components/date-picker-modal.tsx`

**Web compatibility:** `react-native-calendars` is built on React Native primitives (`View`, `Text`, `TouchableOpacity`) and should work on web via `react-native-web` without a `.web.tsx` override. Needs verification during implementation — if it doesn't render correctly, create a web override using HTML `<input type="date">` or a web calendar library.

### 7. Charts (`react-native-chart-kit` + `react-native-svg`)

**Used in:** `screens/weight-history/index.tsx`

**Web compatibility:** `react-native-svg` has web support (`react-native-svg-web`). `react-native-chart-kit` depends on it. This may work out of the box on web. Needs verification — if it doesn't, create `screens/weight-history/index.web.tsx` using a web charting library (e.g., `recharts`, already used in `apps/admin`).

### 8. Gesture Handler (`react-native-gesture-handler`)

**Used in:** `screens/weight-history/index.tsx` (Swipeable), `screens/quick-add/index.tsx` (swipe gestures)

**Web compatibility:** `react-native-gesture-handler` has web support but swipe gestures can be unreliable on web. Needs verification. If swipe doesn't work well, the web override can replace swipe-to-delete with a visible delete button and swipe-to-favorite with a visible favorite button.

### 9. Alert / Linking

**Used in:** Various screens for permission prompts and `Linking.openSettings()`

**Web replacement:** `Alert.alert` maps to `window.confirm` / `window.alert` on web via `react-native-web`. `Linking.openSettings()` is meaningless on web — permission prompts should use browser-native flows or simply show a text message.

## Navigation — Web Considerations

React Navigation has web support. Key considerations:

- **URLs:** React Navigation can be configured with a `linking` config to map screens to URL paths (e.g., `/daily`, `/weekly`, `/login`). This should be added so that browser back/forward buttons work and users can bookmark pages. Without it, the app works but every page is the same URL, which is a poor web experience.
- **`createNativeStackNavigator`:** On web, this renders as a simple stack (no native iOS/Android transitions). It works but transitions may look different. Acceptable for v1.
- **Deep linking:** The `linking` config also enables direct URL access (e.g., `snapcals.com/weekly` loads the weekly view). Important for shareability.

## PWA Configuration

### Web App Manifest

Expo generates a basic `manifest.json` for web builds. It should be configured with:

- `name`: "Snap Cals"
- `short_name`: "Snap Cals"
- `start_url`: "/"
- `display`: "standalone" (full-screen, no browser chrome)
- `background_color`: matches app theme
- `theme_color`: matches app primary color
- `icons`: App icon in required sizes (192x192, 512x512)

This is configured via the `web` section of `app.json`.

### Service Worker

Expo can generate a basic service worker for the app shell. For v1, a minimal service worker that caches the app shell (HTML/CSS/JS) is sufficient — no offline data caching. This makes repeat visits load faster and enables the "Add to Home Screen" prompt on Android Chrome.

## Build & Deployment

### Build

```
cd apps/mobile
npx expo export --platform web
```

Outputs static files to `apps/mobile/dist/`. This is a standard SPA (single `index.html` + JS bundles + assets).

### Hosting

The output is static files — deployable to any static hosting provider:

- **Vercel** — `vercel --prod` from the `dist/` directory, or connect the repo with a build command
- **Netlify** — drag-and-drop `dist/`, or connect repo
- **Cloudflare Pages** — connect repo
- **Render** — add a static site to the existing Render account

SPA routing requires a catch-all redirect rule (all paths → `index.html`) so that React Navigation's client-side routing works. Most providers support this via a config file (e.g., `vercel.json`, `_redirects` for Netlify).

### Environment Variables

The web build uses the same `EXPO_PUBLIC_*` env vars as the native build:

- `EXPO_PUBLIC_API_URL` — production API URL (same as native)
- `EXPO_PUBLIC_API_KEY` — API key (same as native)
- `EXPO_PUBLIC_USE_LOCAL` — for local dev

> Note: `EXPO_PUBLIC_*` vars are embedded in the JS bundle at build time and visible in the browser. The API key is already a "public" key (it gates access but isn't a secret — the real auth is JWT). No secrets should be in `EXPO_PUBLIC_*` vars.

## Acceptance Criteria

### Setup & Build
1. `react-dom`, `react-native-web`, and `@expo/metro-runtime` are added as dependencies to `apps/mobile`
2. `pnpm web` (i.e., `expo start --web`) starts a dev server and the app loads in a browser without crashing
3. `npx expo export --platform web` produces a `dist/` folder with a working SPA
4. The `dist/` output can be served by any static file server and the app loads correctly

### PWA
5. A web app manifest is present with app name, icons, `display: standalone`, and theme colors
6. On mobile Chrome (Android), the browser offers "Add to Home Screen" and the installed app opens in full-screen mode without browser chrome
7. On mobile Safari (iOS), "Add to Home Screen" works and the app opens in standalone mode

### Auth
8. Signup, login, email verification, forgot password, and reset password flows work on web
9. Auth token persists across page refreshes (stored in `localStorage`)
10. Logging out clears the stored token and redirects to the login screen
11. Google OAuth button is hidden on web (v1 is email/password only)

### Core Features
12. Daily view loads and displays food entries grouped by meal type
13. Weekly view loads and displays daily totals
14. Entry form (create/edit/delete food entries) works on web
15. AI Assist screen works — user can type a food description and receive AI estimates
16. AI chat mode (discussion mode) works on web
17. Image input on AI Assist works — user can take a photo (on mobile browsers with camera access) or select from files
18. Quick Add screen works — favorites and recents load, tapping an item navigates to the entry form with prefill
19. Goals screen works — view and edit daily calorie/macro goals
20. AI Goal Coach works — conversational flow for setting goals
21. Weight log screen works — create/edit weight entries with date and time pickers
22. Weight history screen works — chart renders and entry list displays correctly
23. Settings screen works — dark mode toggle, weight unit preference, discussion mode toggle, My Goals link, logout

### Subscription (Web-Specific)
24. Paywall screen shows a "Coming Soon" message instead of the native purchase flow
25. Settings subscription section shows the user's current tier (synced from backend) but does not offer purchase/manage options on web
26. Free-tier AI usage limits are enforced on web (same as native — server-side enforcement)

### Navigation
27. Browser back/forward buttons navigate between screens correctly
28. Refreshing the page restores the current screen (if authenticated) or redirects to login
29. URL paths reflect the current screen (e.g., `/daily`, `/weekly`, `/settings`)

### Responsive Layout
30. The app is usable on mobile browser viewports (375px–430px width)
31. The app is usable on tablet/desktop viewports (no broken layouts, though mobile is the primary design target)
32. Bottom tab bar renders and is tappable on web

### Platform Overrides
33. No runtime errors from native-only modules (`expo-secure-store`, `expo-image-picker`, `expo-speech-recognition`, `react-native-purchases`, `@react-native-community/datetimepicker`) on web
34. Voice input mic button is hidden on web (since `available` returns `false`)
35. Date picker modal works on web (either via `react-native-calendars` compatibility or a web override)
36. Time picker modal works on web (via HTML time input or equivalent web override)

## Risks & Dependencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| `react-native-chart-kit` may not render on web | Weight history chart broken | Verify early; fallback to `recharts` (already used in admin) via `.web.tsx` override |
| `react-native-calendars` may not render on web | Date picker broken | Verify early; fallback to HTML date input via `.web.tsx` override |
| `react-native-gesture-handler` swipe gestures may not work on web | Quick Add swipe-to-favorite/delete broken, Weight History swipe-to-delete broken | Verify early; fallback to visible buttons via `.web.tsx` override |
| `localStorage` JWT storage is vulnerable to XSS | Token theft if XSS exists | Accepted for v1; same pattern as most web SPAs. Future: `httpOnly` cookies |
| React Navigation web support may have quirks (transitions, deep linking edge cases) | Navigation feels janky or URLs don't work perfectly | Test thoroughly; acceptable for v1 if basic navigation works |
| `EXPO_PUBLIC_API_KEY` is visible in browser JS bundle | API key exposed in client code | Already a public key (not a secret); real auth is JWT. Same exposure as native app (decompilable) |
| Some `react-native-web` components may render differently than native | Visual inconsistencies | Test each screen; fix with web-specific styles where needed |

## Future Enhancements (Post-v1)

- **Web payments via Stripe** — enable Pro subscriptions on web
- **Google OAuth on web** — use Google Sign-In for Web SDK
- **Voice logging via Web Speech API** — add browser-based speech recognition
- **Offline support** — service worker caching for offline food logging with background sync
- **`expo-router` migration** — file-based routing with first-class web URL support
- **Server-side rendering** — for SEO/marketing landing pages (not needed for the app itself)
