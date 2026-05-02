# Snap Cals — Roadmap

## Completed

Shipped features in chronological order. Early features used implementation plans; later ones use specs with QA reports.

### 1. CRUD Calorie Tracking App

A foundational mobile app with email/password auth, full CRUD for food entries (name, calories, protein, carbs, fat, serving size, meal type, timestamp), user-configurable daily calorie/macro goals, a daily view with meals grouped by type and progress toward goals, and a weekly overview of daily totals. Built as a pnpm monorepo with shared types.

See [Implementation Plan](./phase-1-implementation-plan.md).

### 2. AI Autofill & UI/UX Refinements

Instead of manually entering food details, the user can type a food name and the AI (Gemini API) returns estimated calories and macros. The user can then edit or confirm the values before saving. Manual entry from Phase 1 remains available as a fallback. Includes UI/UX refinements like smart meal type detection and inline form validation.

See [Implementation Plan](./phase-2-implementation-plan.md).

### 3. AI Chat & Server Improvements

The AI can ask clarifying questions (e.g., "Where did you buy this?", "What size was the portion?") to refine its estimates. This is a conversational flow before the food entry is confirmed. Users can toggle this off if they just want a quick rough estimate without the back-and-forth.

See [Implementation Plan](./phase-3-implementation-plan.md).

### 4. Image Input

Users can take a photo of their food and send it to the AI instead of typing. The AI analyzes the image and returns estimated calories and macros. Same confirmation/chat flow as Phase 3 applies. Users can still type or manually enter as alternatives.

See [Implementation Plan](./phase-4-implementation-plan.md).

### 5. Quick Features & Code Quality

Add favorites and recent foods for quick-add without re-entering details or burning an AI lookup. Add a picture preview and cropping screen after taking a food photo so users can review and frame the image before sending it to the AI. Add Biome as the project-wide linter and formatter.

See [Implementation Plan](./phase-5-implementation-plan.md).

### 6. AI Goal Coach

A conversational AI flow (separate from food logging) that helps users set their daily calorie/macro goals. The AI asks about their objectives (lose weight, gain muscle, maintain), current weight, target weight, activity level, timeline, etc., then recommends daily calorie and macro targets and auto-sets them as the user's goals.

See [Implementation Plan](./phase-6-implementation-plan.md).

### 7. Auth Enhancements

A complete auth overhaul adding email verification via 6-digit OTP codes, password reset via OTP, Google OAuth login (designed to be extensible to future providers like Facebook/Apple), and bidirectional account linking between email and OAuth accounts. Includes a Resend-powered email service for transactional emails, a provider-extensible `AuthProvider` table, and an `Otp` table for verification/reset codes. Uses `expo-auth-session` on mobile for the OAuth flow and `google-auth-library` on the backend for `id_token` verification.

See [Implementation Plan](./phase-7-implementation-plan.md).

### 8. Subscription & Usage Limits

Introduce a freemium model with daily AI usage limits. Free users get a configurable number of AI lookups per day (resetting at UTC 00:00); Pro subscribers get unlimited access. Includes server-side usage tracking per user via an `AiUsage` table, limit enforcement middleware on AI endpoints, a RevenueCat webhook endpoint for subscription lifecycle events, and frontend UI for displaying remaining usage and upgrade prompts. The "Upgrade to Pro" button is a placeholder for now — RevenueCat SDK integration is deferred to Phase 9.

See [Implementation Plan](./phase-8-implementation-plan.md).

### 9. RevenueCat SDK Integration

Wire up the RevenueCat SDK (`react-native-purchases`) on mobile to enable real in-app purchases. Includes configuring RevenueCat with App Store Connect / Google Play Console products, building a paywall screen, connecting the purchase flow to the existing subscription tier and webhook infrastructure from Phase 8. Requires production builds via `eas build`.

See [Implementation Plan](./phase-9-implementation-plan.md).

### 10. Weight Log

Log weight from the daily view FAB, view a line chart with time range filters (7d/30d/90d/All), edit/delete entries, optional notes, date+time picker. Stores both kg and lbs (user picks preferred unit in settings). Includes navigation restructure: Goals tab moves out of bottom tabs into Settings/More; Weight tab takes its place. AI Goal Coach integration with weight data deferred.

See [Spec](./specs/weight-log.md).

### 11. Food Source / Provider Field

Add an optional `source` free-text field (max 100 chars) to food entries and favorites — captures where food came from (e.g., "McDonald's", "Homemade", "Hawker"). AI infers source in one-shot mode when obvious, asks/confirms in chat mode (batched with other questions). Source carries through to favorites, recents, and quick-add prefill. Displayed on entry row cards alongside serving size. AI uses provider-specific nutrition data when a source is known (best effort).

See [Spec](./specs/food-source.md), [QA Report](./specs/food-source-qa.md).

### 12. Voice Logging

Add speech-to-text via `expo-speech-recognition` (on-device, English-only) as an input modality on the AI Assist screen. Mic button in both the initial input row and the chat reply row. Tap to record, tap to stop (or auto-stop at 30s). Interim results shown in real-time. Transcribed text populates the input field (truncated to char limit) — user reviews and submits manually. Permission denied → Alert with "Open Settings" button. Mic hidden if speech recognition unavailable on device. No backend changes. Requires dev build.

See [Spec](./specs/voice-logging.md), [QA Report](./specs/voice-logging-qa.md).

### 13. Admin Panel

A web-based admin dashboard (`apps/admin`, React + Vite) for viewing and managing user data. Separate admin database (Neon) with its own `Admin` model and auth system (email/password + JWT). The Express server connects to both databases via dual Prisma clients. v1 includes: admin login, user list with search, individual user detail (daily entries, weekly summary, weight history, goals — all read + edit for entries/goals), and admin account creation. Dashboard page is a "coming soon" placeholder. Responsive design (desktop + mobile web). No user deletion, no admin password reset, no platform-wide analytics in v1.

See [Spec](./specs/admin-panel.md), [QA Report](./specs/admin-panel-qa.md).

### 14. PWA / Mobile Web Version

Ship the app as a Progressive Web App using Expo's built-in web support (`react-native-web`), avoiding the $99/year Apple Developer fee. Same `apps/mobile` codebase with `.web.ts` / `.web.tsx` overrides for native-only modules (`expo-secure-store` → `localStorage`, `expo-image-picker` → HTML file input, `react-native-purchases` → no-op stubs, `expo-speech-recognition` → disabled, `@react-native-community/datetimepicker` → HTML input). PWA manifest enables "Add to Home Screen" for app-like experience. Web version is free-tier only (paywall shows "Coming Soon"); email/password auth only (no Google OAuth). No voice logging on web. Camera/image input for AI food estimation supported via browser APIs. React Navigation linking config for proper URL paths and browser back/forward. Static build (`npx expo export --platform web`) deployable to any hosting provider.

See [Spec](./specs/pwa-web-version.md), [QA Report](./specs/pwa-web-version-qa.md).

---

## Backlog

Ideas for future work, not yet prioritized or planned.

- **EAS OTA Updates:** Investigate and set up Expo EAS Update for over-the-air JS bundle updates without requiring a full app store release.
- **BYOK (Bring Your Own Key):** Let power users enter their own Gemini API key in settings to get unlimited AI usage without a subscription. Useful as an alternative to paid plans for technical users. Key would be stored encrypted and sent server-side per request.
- **Optimize Image Token Usage in AI Chat:** Currently the food photo is re-sent with every message in the AI chat flow, costing ~250 extra tokens per message. Investigate alternatives (e.g., send image only on first message, cache a text description of the image server-side, or let the user explicitly re-attach). Balance between cost savings and the ability for the AI to reference the photo when asked.
- **Data Export (CSV):** Let users export their food entry and weight data for a date range as a CSV file. Useful for sharing with trainers, doctors, or nutritionists. Server-side endpoint that queries entries and returns CSV. Consider making this a Pro-only feature.
- **Intermittent Fasting Timer:** A start/stop eating window timer with countdown and optional push notifications. Tracks fasting windows (e.g., 16:8, 18:6) and shows current fasting state on the daily view. Mostly a frontend feature with optional server persistence of fasting history.
- **AI Meal Suggestions:** "What should I eat?" button on the daily view that sends remaining daily calories/macros to the AI and returns meal ideas that fit the user's remaining budget. Leverages existing Gemini integration with a new prompt — minimal backend work.
- **Home Screen Widget:** Show daily calorie progress (consumed vs goal) and macro rings on the iOS Lock Screen / home screen widget without opening the app. Uses `expo-widgets` (experimental). Gives users at-a-glance tracking.
- **Multi-Photo Meal Logging:** Let users attach multiple photos in a single AI estimation session (e.g., multiple dishes on a table, different angles). The AI analyzes all images together and returns a combined estimate. Extends the existing image → Gemini pipeline to accept an array of images.

## Known Bugs

(none)
