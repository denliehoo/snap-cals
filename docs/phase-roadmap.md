# Snap Cals — Phase Roadmap

## Tech Stack

| Layer | Tech | Hosting | Cost |
|-------|------|---------|------|
| Monorepo | pnpm workspaces | — | Free |
| Frontend | React Native + Expo + TypeScript | — | Free |
| Navigation | React Navigation | — | Free |
| State Management | Zustand | — | Free |
| Backend | Node.js + Express + TypeScript | Render | Free |
| Auth | Passport.js + JWT | — | Free |
| Database | Postgres + Prisma ORM | Neon | Free |
| AI (Phase 2+) | Gemini API | — | Free tier |

## Phases

### Phase 1: CRUD Calorie Tracking App

A foundational mobile app with email/password auth, full CRUD for food entries (name, calories, protein, carbs, fat, serving size, meal type, timestamp), user-configurable daily calorie/macro goals, a daily view with meals grouped by type and progress toward goals, and a weekly overview of daily totals. Built as a pnpm monorepo with shared types.

**Status:** Planning complete — see [Phase 1 Implementation Plan](./phase-1-implementation-plan.md)

### Phase 2: AI Autofill

Instead of manually entering food details, the user can type a food name and the AI (Gemini API) returns estimated calories and macros. The user can then edit or confirm the values before saving. Manual entry from Phase 1 remains available as a fallback.

Also includes: Google OAuth login (via `passport-google-oauth20`, building on the existing Passport.js setup from Phase 1).

**Status:** Not started

### Phase 3: AI Chat

The AI can ask clarifying questions (e.g., "Where did you buy this?", "What size was the portion?") to refine its estimates. This is a conversational flow before the food entry is confirmed. Users can toggle this off if they just want a quick rough estimate without the back-and-forth.

**Status:** Not started

### Phase 4: Image Input

Users can take a photo of their food and send it to the AI instead of typing. The AI analyzes the image and returns estimated calories and macros. Same confirmation/chat flow as Phase 3 applies. Users can still type or manually enter as alternatives.

**Status:** Not started
