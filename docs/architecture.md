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
│   └── server/          # Express API
│       └── src/
│           ├── routes/        # Express route definitions
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
- `react-native-purchases` SDK configured on app startup with platform-specific API keys from env vars
- `Purchases.logIn(userId)` called after auth (login, signup verification, OAuth, restore) so webhook `app_user_id` maps to DB user ID
- `Purchases.logOut()` called on app logout
- `CustomerInfo` update listener keeps local `tier` in sync (handles renewals, cancellations, restores)
- Custom Paywall screen fetches offerings from RevenueCat, displays monthly product with store price, handles purchase and restore flows
- After successful purchase, optimistic local update (`setTier(PRO)`) — webhook handles server-side tier update
- Requires `expo-dev-client` + EAS Build — native IAP modules don't work in Expo Go
- EAS Build profiles configured in `apps/mobile/eas.json` (development, ios-simulator, preview, production)

### Theme / Design System
- Centralized in `apps/mobile/src/theme.ts`
- Exports `colors`, `spacing`, `fontSize`, `borderRadius` objects
- Includes macro-specific colors (calories, protein, carbs, fat)
- All UI components should import from theme — no hardcoded values
- Designed for easy theme swapping (change colors in one file)

### API Design
- Base path: `/api`
- Auth routes: `/api/auth/signup`, `/api/auth/login`, `/api/auth/verify-email`, `/api/auth/resend-verification`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/google`
- Resource routes: `/api/entries`, `/api/goals`, `/api/favorites`
- Recents route: `GET /api/entries/recent` — returns last 20 food entries for the user (no deduplication)
- AI routes: `/api/ai/estimate` — accepts food description and/or image (base64 + mimeType), returns structured nutrition estimates via Gemini API
- AI routes: `/api/ai/chat` — accepts conversation history (`ChatMessage[]`), optional `forceEstimate` flag, and optional image, returns AI's next response (clarifying question or nutrition estimate) via multi-turn Gemini conversation
- AI routes: `/api/ai/goal-coach` — accepts conversation history (`ChatMessage[]`), returns AI's next response (clarifying question or goal recommendation with daily calories/macros) via multi-turn Gemini conversation for personalized nutrition goal setting
- All non-auth routes protected via Passport.js JWT middleware
- Request/response types defined in `@snap-cals/shared`
- Standard response wrapper: `{ data: T, message?: string }`
- Standard error shape: `{ message: string, errors?: Record<string, string[]> }`

### Auth Flow
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
- Bottom tabs: Daily, Weekly, Goals, More (settings)
- More/Settings tab houses logout, dark mode toggle, and future account-related features
- Auth stack (Login, Signup, VerifyEmail, ForgotPassword, ResetPassword) shown when unauthenticated; main stack with tabs shown when authenticated
- `EntryForm` is a modal screen pushed on top of the tab navigator
- `QuickAdd` screen accessible from the FAB action sheet on Daily View — shows Favorites and Recents sections with swipe gestures (swipe right to favorite a recent, swipe left to remove a favorite)

### Database
- Postgres on Neon (free tier)
- Prisma ORM for schema definition, migrations, and type-safe queries
- Models: User, FoodEntry, Goal, FavoriteFood, AuthProvider, Otp
- AuthProvider tracks OAuth providers per user with `@@unique([provider, providerUserId])` — extensible to Facebook/Apple/GitHub
- Otp stores hashed 6-digit codes for email verification and password reset with 10-min expiry
- FavoriteFood stores reusable food templates per user with `@@unique([userId, name])` and a max of 25 per user
- MealType enum (BREAKFAST, LUNCH, DINNER, SNACK) — defined in both Prisma schema and shared types
- Neon branching: `main` branch for dev data, `unit-test` branch for automated tests
- Migration workflow: always use `prisma migrate dev --create-only` to generate migrations, then `prisma migrate deploy` to apply — never run `prisma migrate dev` without `--create-only` against a database with data you want to keep
- Tests require `DATABASE_URL_TEST` env var pointing to the test branch — they refuse to run without it

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

## Phase Roadmap

- **Phase 1:** CRUD calorie tracking — completed
- **Phase 2:** AI autofill via Gemini API — completed
- **Phase 3:** AI chat with clarifying questions (toggleable) — completed
- **Phase 4:** Image-based food recognition — completed
- **Phase 5:** Quick features (favorites, recents, image crop) & code quality (Biome) — completed
- **Phase 6:** AI Goal Coach — completed
- **Phase 7:** Auth enhancements (email verification, password reset, Google OAuth, account linking) — completed
- **Phase 8:** Subscription & Usage Limits — completed
- **Phase 9:** RevenueCat SDK Integration — completed
