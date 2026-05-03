# Snap Cals — Architecture

## Overview

Snap Cals is a mobile calorie and macro tracking app. Users log food entries, set daily nutrition goals, and view daily/weekly intake summaries. Future phases add AI-powered food recognition via the Gemini API.

## Tech Stack

| Layer | Tech | Rationale |
|-------|------|-----------|
| Monorepo | pnpm workspaces | Shared types between frontend and backend, single install |
| Frontend | React Native + Expo + TypeScript | Cross-platform mobile, fast iteration with Expo |
| Navigation | React Navigation | Standard for React Native/Expo |
| State Management | Zustand | Lightweight, minimal boilerplate, easy to learn |
| Backend | Node.js + Express + TypeScript | Full control over API, unified language with frontend (TS) |
| Auth             | Passport.js + JWT                                        | Abstracts auth strategy, JWT for stateless mobile auth |
| Email            | Resend                                                   | Transactional emails for OTP verification and password reset, generous free tier |
| OAuth (Mobile)   | expo-auth-session                                        | Provider-agnostic OAuth for mobile, works in Expo Go |
| OAuth (Server)   | google-auth-library                                      | Verifies Google id_tokens server-side |
| Database | Postgres + Prisma ORM | Relational data (users, entries, goals), strong aggregation support, Prisma for type-safe queries |
| DB Hosting | Neon | Free tier Postgres, no expiry, serverless |
| Backend Hosting | Render | Free tier, simple git-push deploys |
| AI (Phase 2+) | Gemini API | Free tier, multimodal (text + image) |
| Image Picker | expo-image-picker | Camera and gallery access, returns base64 for Gemini |
| In-App Purchases | RevenueCat (react-native-purchases) | Cross-platform subscription management, webhook-driven tier updates |
| Linter/Formatter | Biome | Fast, single tool for formatting + linting, replaces ESLint/Prettier |
| Charts           | react-native-chart-kit + react-native-svg | Lightweight line chart for weight history, Expo-compatible |
| Speech Recognition | expo-speech-recognition | On-device voice-to-text for hands-free food logging, requires dev build |
| OTA Updates      | expo-updates                                             | Over-the-air JS bundle updates without full native rebuild |
| Web Support      | react-native-web + react-dom + @expo/metro-runtime       | PWA / mobile web version via Expo's web target, same codebase as native |
| Admin Frontend   | React + Vite + TypeScript                                | Lightweight SPA for admin dashboard, no SSR needed |
| Admin DB         | Postgres (Neon, separate project)                        | Isolates admin auth data from app user data |
| Admin Charts     | Recharts (or similar)                                    | Lightweight web charting for weight history in admin |
| Admin CSS        | Tailwind CSS                                             | Utility-first, responsive design out of the box |

## Monorepo Structure

```
snap-cals/
├── apps/
│   ├── mobile/          # React Native + Expo app
│   │   └── src/
│   │       ├── screens/       # Screen components
│   │       ├── components/    # Reusable UI components
│   │       ├── services/      # API service layer
│   │       ├── stores/        # Zustand stores
│   │       └── theme.ts       # Design system (colors, spacing, fonts)
│   ├── admin/           # React + Vite admin dashboard
│   │   └── src/
│   │       ├── pages/         # Page components (login, users, etc.)
│   │       ├── components/    # Reusable UI components
│   │       └── services/      # API service layer
│   └── server/          # Express API
│       └── src/
│           ├── routes/        # Express route definitions (app + admin)
│           ├── controllers/   # Request handlers
│           ├── services/      # Business logic (Gemini AI, etc.)
│           └── middleware/     # Auth, validation, error handling
├── packages/
│   └── shared/          # Shared TypeScript types and enums
│       └── src/
│           └── index.ts       # MealType enum, interfaces, API types
├── docs/                # Architecture, plans, roadmap
├── pnpm-workspace.yaml
└── package.json
```

## Key Decisions

### Shared types via tsconfig path aliases
- `@snap-cals/shared` maps to `../../packages/shared/src` in both apps' `tsconfig.json`
- Mobile app uses `@/*` alias mapping to `src/*` for all internal imports (configured in `tsconfig.json`, `jest.config.ts`)
- Server uses `tsconfig-paths/register` for runtime resolution with ts-node
- Expo/Metro handles tsconfig paths natively
- No build step needed — changes to shared types are picked up immediately
- Nodemon watches `packages/shared/src` so the server restarts on shared type changes

### Discussion Mode (AI Chat)
- Toggleable per-session on the AI Assist screen, with a global default persisted in SecureStore via a Zustand settings store
- When on, the AI asks clarifying questions before estimating; when off, behavior is one-shot (Phase 2)
- Chat is stateless on the server — the mobile app sends the full `ChatMessage[]` history each request
- Chat history is ephemeral (screen state only, not persisted to DB)

### Image Input (Phase 4)
- Users can take a photo or pick from gallery via `expo-image-picker` on the AI Assist screen
- Image is sent as base64 + mimeType to the server, which forwards it to Gemini as `inlineData`
- Works in both one-shot mode (image → estimate → entry form) and chat mode (image starts conversation)
- Image is validated client-side and server-side: allowed types (`image/jpeg`, `image/png`, `image/webp`, `image/heic`), max size `MAX_IMAGE_SIZE` (5MB base64 length)
- In chat mode, the image is sent with the first message only; subsequent messages rely on Gemini's context
- Image is ephemeral — not persisted to DB, cleared when navigating away from the screen
- After taking/picking a photo, the native OS crop UI is shown via `allowsEditing: true` in `expo-image-picker` options

### Goal Coach (Phase 6)
- Conversational AI flow accessible from Goals screen via "Let AI set my goals" button
- Uses same stateless multi-turn pattern as food chat — client sends full `ChatMessage[]` history each request
- Server-side `goal-coach.service.ts` encodes Mifflin-St Jeor BMR, TDEE activity multipliers, and evidence-based macro splits
- Safety guardrails: minimum calorie floors (1200/1500 kcal), no extreme deficits, healthcare disclaimer
- When AI produces a recommendation, it appears with a "Set as my goals" button that navigates back to Goals screen with values pre-filled
- Chat history is ephemeral (screen state only, not persisted to DB)

### In-App Purchases (RevenueCat)

### Weight Log
- Weight entries store both `weightKg` and `weightLbs` — user enters in their preferred unit, server computes the counterpart (1 kg = 2.20462 lbs)
- Weight unit preference is client-side only (SecureStore via settings Zustand store), defaults to kg
- Weight History screen (Weight tab) shows a line chart (`react-native-chart-kit` + `react-native-svg`) with time range filter (7d/30d/90d/All) and a scrollable entry list
- Multiple weight entries per day are allowed
- FAB action sheet on Daily View includes "Log Weight" option
- Chart and list auto-refresh on screen focus (via `useFocusEffect`) to reflect adds/edits/deletes

### In-App Purchases (RevenueCat)
- `react-native-purchases` SDK configured on app startup with platform-specific API keys from env vars
- `Purchases.logIn(userId)` called after auth (login, signup verification, OAuth, restore) so webhook `app_user_id` maps to DB user ID
- `Purchases.logOut()` called on app logout
- `CustomerInfo` update listener keeps local `tier` in sync (handles renewals, cancellations, restores)
- Custom Paywall screen fetches offerings from RevenueCat, displays monthly product with store price, handles purchase and restore flows
- After successful purchase, optimistic local update (`setTier(PRO)`) — webhook handles server-side tier update
- Requires `expo-dev-client` + EAS Build — native IAP modules don't work in Expo Go
- EAS Build profiles configured in `apps/mobile/eas.json` (development, ios-simulator, preview, production)

### Voice Logging
- `expo-speech-recognition` provides on-device speech-to-text on the AI Assist screen
- Available in both initial input mode (description field) and chat mode (reply field)
- `useVoiceInput` hook (co-located in `screens/ai-assist/`) encapsulates permissions, recording state, interim results, 30-second timeout, and cleanup
- Mic button is hidden entirely if speech recognition is unavailable on the device
- Transcribed text is truncated to the field's max length (`AI_DESCRIPTION_MAX_LENGTH` or `AI_CHAT_REPLY_MAX_LENGTH`)
- Requires dev build (`expo-dev-client`) — does not work in Expo Go

### Theme / Design System
- Centralized in `apps/mobile/src/theme.ts`
- Exports `colors`, `spacing`, `fontSize`, `borderRadius` objects
- Includes macro-specific colors (calories, protein, carbs, fat)
- All UI components should import from theme — no hardcoded values
- Designed for easy theme swapping (change colors in one file)
- Android native dialogs (time picker, etc.) are themed via an Expo config plugin (`plugins/with-custom-theme.js`) that sets `colorPrimary`/`colorAccent` in Android's `styles.xml`. This only takes effect in `eas build` — Expo Go uses its own native theme, so native dialogs will appear with default blue colors during Expo Go development.

### Web / PWA Support
- Same `apps/mobile` codebase compiled for web via `react-native-web` + Expo's web target
- Platform-specific code uses `.web.ts` / `.web.tsx` file extension convention — Metro resolves these automatically on web builds
- Storage abstraction: `utils/storage.ts` (wraps `expo-secure-store`) and `utils/storage.web.ts` (wraps `localStorage`) — all stores and contexts import from `utils/storage`
- Web overrides exist for: image picker, voice input, purchases, paywall, settings, time picker, quick-add, weight history, Google auth
- Google OAuth button is conditionally rendered (hidden on web where `useGoogleAuth` returns `ready: false`)
- Paywall shows "Coming Soon" on web — no in-app purchases
- Swipe gestures (quick-add, weight history) replaced with visible buttons on web
- Weight history chart omitted on web (react-native-chart-kit web compatibility is unreliable)
- Navigation linking config maps screens to URL paths for browser back/forward and bookmarking (web only)
- PWA manifest configured in `app.json` `web` section: standalone display, theme colors, app name
- Build: `npx expo export --platform web` → static SPA in `dist/`
- Dev: `pnpm dev:mw` or `expo start --web`

### EAS OTA Updates
- `expo-updates` checks for OTA JS bundle updates on every native app launch (not on web or dev builds)
- `runtimeVersion` uses `"appVersion"` policy — tied to `version` in `app.json`
- `eas.json` channels: `preview` for internal testing, `production` for released builds; dev profiles have no channel
- Update check and download are silent and non-blocking — user sees current bundle immediately
- On successful download, a snackbar with "Restart" action button appears (10s auto-dismiss); tapping reloads the app via `Updates.reloadAsync()`
- If dismissed, the update applies on next app open
- Network errors during check are silently ignored
- `useOtaUpdate` hook in `src/hooks/` with a `.web.ts` no-op counterpart
- Snackbar component extended to support optional action button (`{ label, onPress }`) and configurable duration
- Publish workflow: `pnpm eas-update:preview` / `pnpm eas-update:production` (runs `eas update --channel <channel>`)

### API Design
- Base path: `/api`
- Auth routes: `/api/auth/signup`, `/api/auth/login`, `/api/auth/verify-email`, `/api/auth/resend-verification`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/google`
- Resource routes: `/api/entries`, `/api/goals`, `/api/favorites`, `/api/weight`
- Recents route: `GET /api/entries/recent` — returns last 20 food entries for the user (no deduplication)
- AI routes: `/api/ai/estimate` — accepts food description and/or image (base64 + mimeType), returns structured nutrition estimates via Gemini API. Includes optional `source` field when the provider is identifiable from the description.
- AI routes: `/api/ai/chat` — accepts conversation history (`ChatMessage[]`), optional `forceEstimate` flag, and optional image, returns AI's next response (clarifying question or nutrition estimate with optional `source`) via multi-turn Gemini conversation
- AI routes: `/api/ai/goal-coach` — accepts conversation history (`ChatMessage[]`), returns AI's next response (clarifying question or goal recommendation with daily calories/macros) via multi-turn Gemini conversation for personalized nutrition goal setting
- All non-auth routes protected via Passport.js JWT middleware
- Request/response types defined in `@snap-cals/shared`
- Standard response wrapper: `{ data: T, message?: string }`
- Standard error shape: `{ message: string, errors?: Record<string, string[]> }`

### API Security
- **API key**: All `/api/*` routes (except `/api/health` and `/api/webhooks`) require an `X-Api-Key` header matching `process.env.API_KEY`. Middleware: `src/middleware/api-key.ts`. The mobile app sends this header with every request via `EXPO_PUBLIC_API_KEY`.
- **Rate limiting**: `express-rate-limit` applied per-IP on abuse-prone routes. Auth routes (`/api/auth/*`): 20 requests / 15 min. AI routes (`/api/ai/*`): 30 requests / 15 min. Middleware: `src/middleware/rate-limit.ts`.
- **Webhooks**: `/api/webhooks/*` is mounted before the API key middleware — webhooks authenticate via their own `Bearer` secret in the `Authorization` header.
- **Route protection order in `app.ts`**: health check (public) → signup-status (public) → webhooks (own auth) → API key gate → rate limiters on auth/AI → Passport JWT on protected routes.

- Email/password signup with OTP email verification (6-digit code via Resend, 10-min expiry, bcrypt-hashed)
- Signup returns `{ userId, emailVerified: false }` — no JWT until verified
- Login for unverified users returns the same pending response, redirecting to verification screen
- OAuth users (Google) skip email verification — marked verified on creation
- Password reset via OTP email: `POST /api/auth/forgot-password` → `POST /api/auth/reset-password`
- Forgot-password always returns 200 regardless of email existence (prevents enumeration)
- Google OAuth: mobile uses `expo-auth-session` to get `id_token`, sends to `POST /api/auth/google`, backend verifies with `google-auth-library`
- Account linking: Google login with an existing email auto-links the accounts; `AuthProvider` table tracks provider relationships
- Provider-extensible: adding Facebook/Apple is a new `AuthProvider` row, not a schema migration
- Passwords hashed with bcrypt
- JWT returned on successful verification/login/OAuth, stored in `expo-secure-store` on mobile
- Passport.js JWT strategy validates tokens on protected routes
- Zustand auth store manages token/user state on frontend
- React Navigation switches between auth stack and main app stack based on auth state

### Navigation
- Bottom tabs: Daily, Weekly, Weight, More (settings)
- Goals screen is accessible from the More/Settings tab via a "My Goals" row (navigates as a stack screen)
- More/Settings tab houses logout, dark mode toggle, weight unit preference, My Goals link, and future account-related features
- Auth stack (Login, Signup, VerifyEmail, ForgotPassword, ResetPassword) shown when unauthenticated; main stack with tabs shown when authenticated
- `EntryForm` is a modal screen pushed on top of the tab navigator
- `WeightLog` is a modal screen pushed on top of the tab navigator (for logging/editing weight entries)
- `Goals` is a stack screen accessible from Settings (moved out of bottom tabs to make room for Weight tab)
- `QuickAdd` screen accessible from the FAB action sheet on Daily View — shows Favorites and Recents sections with swipe gestures (swipe right to favorite a recent, swipe left to remove a favorite)

### Database
- Postgres on Neon (free tier)
- Prisma ORM for schema definition, migrations, and type-safe queries
- Models: User, FoodEntry, Goal, FavoriteFood, AuthProvider, Otp, WeightEntry
- AuthProvider tracks OAuth providers per user with `@@unique([provider, providerUserId])` — extensible to Facebook/Apple/GitHub
- Otp stores hashed 6-digit codes for email verification and password reset with 10-min expiry
- FavoriteFood stores reusable food templates per user with `@@unique([userId, name])` and a max of 25 per user
- FoodEntry and FavoriteFood have an optional `source` field (string, nullable) for recording where food came from (e.g. "McDonald's", "Homemade")
- MealType enum (BREAKFAST, LUNCH, DINNER, SNACK) — defined in both Prisma schema and shared types
- UserStatus enum (VERIFIED, UNVERIFIED, DEACTIVATED) — replaces the old `emailVerified` boolean on User. Admins can change status from the admin panel. DEACTIVATED users are immediately locked out via the Passport JWT middleware.
- Neon branching: `main` branch for dev data, `unit-test` branch for automated tests
- Migration workflow: always use `prisma migrate dev --create-only` to generate migrations, then `prisma migrate deploy` to apply — never run `prisma migrate dev` without `--create-only` against a database with data you want to keep
- Tests require `DATABASE_URL_TEST` env var pointing to the test branch — they refuse to run without it

### Admin Database
- Separate Neon project for admin auth data — isolates admin credentials from app user data
- Prisma schema at `prisma/admin/schema.prisma`, generates to `node_modules/.prisma/admin-client`
- Admin migrations live in `prisma/admin/migrations/` (separate from app migrations in `prisma/migrations/`) — Prisma resolves the migrations directory relative to the schema file
- Server imports two Prisma clients: `src/lib/prisma.ts` (app DB) and `src/lib/admin-prisma.ts` (admin DB)
- `postinstall` runs `prisma generate` for both schemas
- Admin models: `Admin` (id, email, name, passwordHash, createdAt), `PlatformSetting` (key, value, updatedAt) for admin-controlled feature flags (e.g., signupEnabled) and operational settings (e.g., freeDailyAiLimit)
- Admin auth uses a separate JWT secret (`ADMIN_JWT_SECRET`) — must differ from the app JWT secret
- Admin JWT payload includes `role: "admin"` to distinguish from app JWTs
- Admin routes at `/api/admin/*` are protected by `authenticateAdmin` middleware (except `/api/admin/auth/login`)
- Seed script: `pnpm seed:admin` creates the first admin account

## Mobile Conventions

### File Naming
- All files and folders use kebab-case (e.g. `home-screen.tsx`, `use-entry-form.ts`)

### Screen Structure
- Every screen is a folder in `src/screens/` with an `index.tsx` (e.g. `screens/home/index.tsx`)
- When a screen needs extracted logic, add a co-located hook file (e.g. `screens/entry-form/use-entry-form.ts`)
- Only move a hook to `src/hooks/` when it's used by multiple screens (e.g. `hooks/use-auth-form.ts`). Default is co-location.
- Screens are thin rendering layers — state, validation, and API calls live in custom hooks

### Reusable Components
- Shared UI components live in `src/components/` (e.g. `form-field.tsx`, `button.tsx`, `fab.tsx`)
- Co-locate components in the screen folder when only used by that screen
- Only move a component to `src/components/` when it's used (or will be used) by multiple screens

### Theme System
- All visual tokens live in `src/theme.ts`: `colors`, `spacing`, `fontSize`, `borderRadius`, `fontWeight`
- No hardcoded colors, font weights, or spacing in components — always reference theme tokens
- `colors.textOnPrimary` for text on colored backgrounds, `fontWeight.bold`/`semibold` for weights

### Error & Success Feedback
- Validation errors display inline below each field via the `FormField` `error` prop (per-field `fieldErrors` state, not a single error string)
- API errors show as error snackbars via `useSnackbar().show(msg, "error")` — hooks accept an `onError` callback rather than managing error state
- All catch blocks use `catch (e: unknown)` with `getErrorMessage(e, fallback)` from `utils/error.ts` — never use `catch (e: any)`
- When `onError` callbacks are used inside `useCallback` dependency arrays, store them in a ref (`onErrorRef`) to avoid infinite re-render loops
- API success shows as a success snackbar when the outcome isn't obvious from navigation (e.g. entry added/deleted, goals saved — but not login/signup)

## Testing

### Backend
- Jest + Supertest for API endpoint tests
- Tests run against a separate Neon branch (`unit-test`) via `DATABASE_URL_TEST`
- Tests refuse to run if `DATABASE_URL_TEST` is not set
- Run `pnpm migrate:test` (in `apps/server`) after new migrations to apply them to the test branch — Prisma's `.env` loading ignores env overrides, so this script temporarily hides `.env` to force the correct URL

### Frontend (Mobile)
- Jest + React Native Testing Library with `jest-expo` preset
- Tests are co-located next to source files (e.g. `screens/login/index.test.tsx`)
- Custom `render` in `src/__tests__/helpers.tsx` wraps components in ThemeProvider + SnackbarProvider
- Always import `render` from helpers, not directly from `@testing-library/react-native`
- `pnpm test` runs both suites; `pnpm test:server` and `pnpm test:mobile` run individually
