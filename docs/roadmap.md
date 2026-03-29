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

---

## Backlog

Ideas for future work, not yet prioritized or planned.

- **EAS OTA Updates:** Investigate and set up Expo EAS Update for over-the-air JS bundle updates without requiring a full app store release.
- **BYOK (Bring Your Own Key):** Let power users enter their own Gemini API key in settings to get unlimited AI usage without a subscription. Useful as an alternative to paid plans for technical users. Key would be stored encrypted and sent server-side per request.
- **Optimize Image Token Usage in AI Chat:** Currently the food photo is re-sent with every message in the AI chat flow, costing ~250 extra tokens per message. Investigate alternatives (e.g., send image only on first message, cache a text description of the image server-side, or let the user explicitly re-attach). Balance between cost savings and the ability for the AI to reference the photo when asked.

## Known Bugs

(none)
