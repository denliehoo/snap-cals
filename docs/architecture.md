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
| Auth | Passport.js + JWT | Abstracts auth strategy, JWT for stateless mobile auth |
| Database | Postgres + Prisma ORM | Relational data (users, entries, goals), strong aggregation support, Prisma for type-safe queries |
| DB Hosting | Neon | Free tier Postgres, no expiry, serverless |
| Backend Hosting | Render | Free tier, simple git-push deploys |
| AI (Phase 2+) | Gemini API | Free tier, multimodal (text + image) |

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
- Server uses `tsconfig-paths/register` for runtime resolution with ts-node
- Expo/Metro handles tsconfig paths natively
- No build step needed — changes to shared types are picked up immediately
- Nodemon watches `packages/shared/src` so the server restarts on shared type changes

### Theme / Design System
- Centralized in `apps/mobile/src/theme.ts`
- Exports `colors`, `spacing`, `fontSize`, `borderRadius` objects
- Includes macro-specific colors (calories, protein, carbs, fat)
- All UI components should import from theme — no hardcoded values
- Designed for easy theme swapping (change colors in one file)

### API Design
- Base path: `/api`
- Auth routes: `/api/auth/signup`, `/api/auth/login`
- Resource routes: `/api/entries`, `/api/goals`
- All non-auth routes protected via Passport.js JWT middleware
- Request/response types defined in `@snap-cals/shared`
- Standard response wrapper: `{ data: T, message?: string }`
- Standard error shape: `{ message: string, errors?: Record<string, string[]> }`

### Auth Flow
- Email/password signup and login
- Passwords hashed with bcrypt
- JWT returned on signup/login, stored in `expo-secure-store` on mobile
- Passport.js JWT strategy validates tokens on protected routes
- Zustand auth store manages token/user state on frontend
- React Navigation switches between auth stack and main app stack based on auth state

### Navigation
- Bottom tabs: Daily, Weekly, Goals, More (settings)
- More/Settings tab houses logout, dark mode toggle, and future account-related features
- Auth stack (Login, Signup) shown when unauthenticated; main stack with tabs shown when authenticated
- `EntryForm` is a modal screen pushed on top of the tab navigator

### Database
- Postgres on Neon (free tier)
- Prisma ORM for schema definition, migrations, and type-safe queries
- Models: User, FoodEntry, Goal
- MealType enum (BREAKFAST, LUNCH, DINNER, SNACK) — defined in both Prisma schema and shared types
- Neon branching: `main` branch for dev data, `unit-test` branch for automated tests
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

## Testing

### Backend
- Jest + Supertest for API endpoint tests
- Tests run against a separate Neon branch (`unit-test`) via `DATABASE_URL_TEST`
- Tests refuse to run if `DATABASE_URL_TEST` is not set

### Frontend (Mobile)
- Jest + React Native Testing Library with `jest-expo` preset
- Tests are co-located next to source files (e.g. `screens/login/index.test.tsx`)
- Custom `render` in `src/__tests__/helpers.tsx` wraps components in ThemeProvider + SnackbarProvider
- Always import `render` from helpers, not directly from `@testing-library/react-native`
- `pnpm test` runs both suites; `pnpm test:server` and `pnpm test:mobile` run individually

## Phase Roadmap

- **Phase 1:** CRUD calorie tracking (current)
- **Phase 2:** AI autofill via Gemini API
- **Phase 3:** AI chat with clarifying questions (toggleable)
- **Phase 4:** Image-based food recognition
