# Snap Cals — Phase Roadmap

## Tech Stack

| Layer            | Tech                             | Hosting | Cost      |
| ---------------- | -------------------------------- | ------- | --------- |
| Monorepo         | pnpm workspaces                  | —       | Free      |
| Frontend         | React Native + Expo + TypeScript | —       | Free      |
| Navigation       | React Navigation                 | —       | Free      |
| State Management | Zustand                          | —       | Free      |
| Backend          | Node.js + Express + TypeScript   | Render  | Free      |
| Auth             | Passport.js + JWT                | —       | Free      |
| Database         | Postgres + Prisma ORM            | Neon    | Free      |
| AI (Phase 2+)    | Gemini API                       | —       | Free tier |

## Phases

### Phase 1: CRUD Calorie Tracking App

A foundational mobile app with email/password auth, full CRUD for food entries (name, calories, protein, carbs, fat, serving size, meal type, timestamp), user-configurable daily calorie/macro goals, a daily view with meals grouped by type and progress toward goals, and a weekly overview of daily totals. Built as a pnpm monorepo with shared types.

**Status:** Completed — see [Phase 1 Implementation Plan](./phase-1-implementation-plan.md)

### Phase 2: AI Autofill & UI/UX Refinements

Instead of manually entering food details, the user can type a food name and the AI (Gemini API) returns estimated calories and macros. The user can then edit or confirm the values before saving. Manual entry from Phase 1 remains available as a fallback. Includes UI/UX refinements like smart meal type detection and inline form validation.

**Status:** Completed — see [Phase 2 Implementation Plan](./phase-2-implementation-plan.md)

### Phase 3: AI Chat & Server Improvements

The AI can ask clarifying questions (e.g., "Where did you buy this?", "What size was the portion?") to refine its estimates. This is a conversational flow before the food entry is confirmed. Users can toggle this off if they just want a quick rough estimate without the back-and-forth.

**Status:** Completed — see [Phase 3 Implementation Plan](./phase-3-implementation-plan.md)

### Phase 4: Image Input

Users can take a photo of their food and send it to the AI instead of typing. The AI analyzes the image and returns estimated calories and macros. Same confirmation/chat flow as Phase 3 applies. Users can still type or manually enter as alternatives.

**Status:** Not started

### Phase 5: Subscription & Usage Limits

Introduce a freemium model with monthly AI usage limits. Free users get a set number of AI lookups per month (estimate, chat, image); paid subscribers get unlimited access. Includes server-side usage tracking per user, limit enforcement middleware on AI endpoints, and frontend UI for displaying remaining usage and upgrade prompts.

**Status:** Not started

---

## Product Backlog

Ideas for future phases, not yet prioritized or planned.

- **Google OAuth:** Add Google OAuth login as an alternative to email/password, using `passport-google-oauth20` building on the existing Passport.js setup. Includes Expo AuthSession for the mobile OAuth redirect flow, account linking (Google + existing email accounts), and DB schema updates to support multiple auth providers per user.
- **BYOK (Bring Your Own Key):** Let power users enter their own Gemini API key in settings to get unlimited AI usage without a subscription. Useful as an alternative to paid plans for technical users. Key would be stored encrypted and sent server-side per request.
- **Favorites & Recent Foods:** Quick-add from a list of frequently logged or recently logged items without re-entering details or burning an AI lookup. Tap a favorite → goes straight to entry form pre-filled.
- **AI Goal Coach:** A conversational AI flow (separate from food logging) that helps users set their daily calorie/macro goals. The AI asks about their objectives (lose weight, gain muscle, maintain), current weight, target weight, activity level, timeline, etc., then recommends daily calorie and macro targets and auto-sets them as the user's goals.
