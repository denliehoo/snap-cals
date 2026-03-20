# Phase 5: Quick Features & Code Quality — Implementation Plan

## Problem Statement

Phase 5 adds two improvements: (1) Favorites & Recent Foods for quick-add without re-entering details or using AI, and (2) Picture Preview & Cropping so users can review/reframe photos before sending to AI.

## Requirements

- **Favorites:** Server-side `FavoriteFood` table, explicit favorite/unfavorite via heart icon, API endpoints for CRUD
- **Recents:** Server endpoint returning last 20 unique foods logged by the user
- **Quick Add:** New screen accessible from FAB action sheet, shows Favorites section + Recents section, tapping an item navigates to EntryForm pre-filled
- **Picture Preview & Cropping:** After taking/picking a photo, show a preview screen where the user can crop/reframe before proceeding to AI Assist

## Background

- Current data model has `FoodEntry` with full nutrition data; favorites will be a separate `FavoriteFood` table storing reusable food templates
- Image picker currently uses `expo-image-picker` with base64 output at 0.7 quality; cropping can use `expo-image-manipulator` for crop operations
- The FAB action sheet on Daily View already has "Manual Entry" and "AI Assist" — "Quick Add" becomes a third option
- MyFitnessPal and other top apps use a hybrid favorites (explicit) + recents (auto) pattern with a dedicated screen/tab

## Proposed Solution

### Data Model

```
FavoriteFood {
  id          String   @id @default(cuid())
  userId      String
  name        String
  calories    Float
  protein     Float
  carbs       Float
  fat         Float
  servingSize String
  mealType    MealType
  createdAt   DateTime @default(now())
  user        User     @relation(...)

  @@unique([userId, name])  // one favorite per food name per user
}
```

### Flow

```
Daily View FAB → Action Sheet
  ├── Manual Entry → EntryForm
  ├── AI Assist → AiAssist screen
  └── Quick Add (NEW) → Quick Add screen
                           ├── Favorites section
                           └── Recents section
                                 └── Tap item → EntryForm (pre-filled)

AI Assist → Camera/Gallery → Preview & Crop (NEW) → AI Assist (with cropped image)
```

## Task Breakdown

### Task 1: FavoriteFood schema + migration + server endpoints

- [x] **Objective:** Add the `FavoriteFood` model and CRUD API endpoints
- **Implementation:**
  - Add `FavoriteFood` model to `prisma/schema.prisma` with `@@unique([userId, name])`
  - Add `favorites FavoriteFood[]` relation to `User` model
  - Run `prisma migrate dev` to create the migration
  - Add shared types to `packages/shared/src/index.ts`: `FavoriteFoodItem`, `CreateFavoriteFoodRequest`, API response types
  - Create `src/controllers/favorite.controller.ts` with: `create` (add favorite), `list` (get all favorites for user), `remove` (delete by id)
  - Create `src/routes/favorite.routes.ts` — `POST /`, `GET /`, `DELETE /:id` — all behind `authenticate`
  - Register routes in `app.ts` at `/api/favorites`
- **Test:** Write tests in `src/__tests__/favorites.test.ts` — create favorite, list favorites, delete favorite, duplicate name returns 409, can't delete another user's favorite
- **Demo:** `curl` the favorites endpoints — create a favorite, list it, delete it.

### Task 2: Recents server endpoint

- [x] **Objective:** Add an endpoint that returns the last 20 unique foods logged by the user
- **Implementation:**
  - Add `getRecent` to `src/controllers/entry.controller.ts` — query `FoodEntry` for the user, ordered by `createdAt desc`, deduplicate by `name` (take the most recent entry per unique name), limit 20
  - Add `GET /recent` route to `entry.routes.ts`
  - Add `RecentFoodItem` type to shared package (same shape as `FavoriteFoodItem` — name, calories, protein, carbs, fat, servingSize, mealType)
- **Test:** Add test in `src/__tests__/entries.test.ts` — log multiple entries with some duplicate names, verify `/entries/recent` returns deduplicated list ordered by most recent, max 20
- **Demo:** Seed some entries, `curl /api/entries/recent` — see deduplicated recent foods.

### Task 3: Mobile API layer + Quick Add screen

- [x] **Objective:** Build the Quick Add screen showing favorites and recents, accessible from the FAB action sheet
- **Implementation:**
  - Add `getFavorites`, `createFavorite`, `deleteFavorite`, `getRecentFoods` to `api.ts`
  - Create `src/screens/quick-add/` with `index.tsx` and `use-quick-add.ts`
  - `use-quick-add.ts`: fetches favorites and recents on mount, exposes `addFavorite`, `removeFavorite`, loading states
  - `index.tsx`: Two sections (Favorites, Recents) using `SectionList`. Each row shows food name, calories, macros (reuse `EntryRow`-like layout). Tapping a row navigates to `EntryForm` with `prefill` data. Empty states for each section.
  - Add `QuickAdd` to `MainStackParamList` in `navigation.tsx` and register the screen
  - Add "Quick Add" option (with `star-outline` icon) to the FAB action sheet in Daily View
- **Test:** Write test for Quick Add screen — renders favorites and recents sections, tapping an item navigates to EntryForm
- **Demo:** Open app → tap FAB → "Quick Add" → see favorites and recents → tap one → lands on EntryForm pre-filled.

### Task 4: ~~Favorite toggle from Entry Row~~ (Removed)

- [x] **Objective:** ~~Let users favorite/unfavorite foods directly from the daily view~~
- **Outcome:** Heart icon on entry rows was implemented then removed — name-based matching caused confusing UX when multiple entries shared the same name (all showed filled hearts). Favorites are now managed exclusively from the Quick Add screen via swipe gestures.

### Task 5: Simplify favorites and recents with swipe gestures

- [x] **Objective:** Remove `favoriteId` linking, simplify recents to last 20 entries (no dedup), add guardrails to favorites, implement swipe-based favorite management
- **Implementation:**
  - Remove `favoriteId` column from `FoodEntry` schema and shared type
  - Remove heart icon and all favorites logic from `EntryRow` and `use-daily-entries.ts`
  - Revert `createFavorite` to reject 409 on duplicate name (shows "Already in favorites" error)
  - Add a max of 25 favorites — server rejects with 409 if limit reached
  - Simplify server `getRecent` to return last 20 entries as-is (no deduplication)
  - Install `react-native-gesture-handler`, wrap app with `GestureHandlerRootView`
  - Quick Add screen swipe gestures using `Swipeable` and `RectButton`:
    - Recents: swipe right → green background + heart icon → adds to favorites
    - Favorites: swipe left → red background + trash icon → confirmation alert → removes
    - Tap: navigates to entry form with prefill
  - Entry form title simplified to "Add Entry" for all prefill cases (was "Review AI Estimate")
- **Test:** Update favorites test for 409 on duplicate, update recents test for no dedup
- **Demo:** Quick Add → swipe right on a recent to favorite → swipe left on a favorite to remove → tap to log entry.

### Task 6: Picture Preview & Crop screen

- [x] **Objective:** After taking/picking a photo, allow the user to crop before proceeding
- **Implementation:**
  - Added `allowsEditing: true` to `PICKER_OPTIONS` in `use-image-picker.ts`
  - This enables the native OS crop UI (iOS/Android) after taking or selecting a photo
  - No custom screen needed — `expo-image-picker` handles the crop UI out of the box
- **Test:** Manual — take/pick a photo, native crop UI appears, cropped image shows in AI Assist
- **Demo:** On AI Assist → tap camera → take photo → native crop UI → adjust crop → confirm → back on AI Assist with cropped image thumbnail.

### Task 7: Add Biome for formatting + linting

- [x] **Objective:** Add Biome as the project-wide formatter and linter, replacing the need for ESLint/Prettier
- **Implementation:**
  - [x] Install `@biomejs/biome` as a dev dependency at the workspace root
  - [x] Add `biome.json` at the repo root configured to cover `apps/mobile`, `apps/server`, `packages/shared`
  - [x] Add root `package.json` scripts: `lint` (`biome lint`), `format` (`biome format --write`), `check` (`biome check --write`)
  - [x] Only safe fixes — do not use `--unsafe` flag
  - [x] Run initial `biome check --write` pass to format and fix existing code
  - [x] Remove the "Add Biome" item from the Product Backlog in `docs/phase-roadmap.md`
  - [x] Create `.kiro/skills/biome-conventions.md` skill so Kiro-generated code follows Biome's formatting and lint rules (e.g., use `import type`, no unused imports, double quotes vs single quotes — whatever `biome.json` enforces)
  - [x] Fix all remaining warnings: replace `any` with proper types, remove non-null assertions, fix React hook dependency arrays — goal is zero warnings from `pnpm check`
  - [x] Promote `noExplicitAny`, `noNonNullAssertion`, and `useExhaustiveDependencies` back to `error` in `biome.json` once all warnings are resolved
- **Test:** `pnpm check` exits 0 with no errors or warnings
- **Demo:** Run `pnpm check` — all files pass with zero diagnostics. Introduce a formatting violation, re-run — Biome catches it.

### Task 8: Update docs + Kiro skills

- [ ] **Objective:** Update architecture docs, phase roadmap, and Kiro skills to reflect Phase 5 changes
- **Implementation:**
  - Update `docs/architecture.md` with FavoriteFood model, new API routes, Quick Add screen, image preview flow
  - Mark tasks in this file as completed
  - Update `docs/phase-roadmap.md` Phase 5 status to "Completed"
  - Update `.kiro/skills/mobile-conventions.md` if any new patterns emerged
- **Test:** N/A (docs only)
- **Demo:** All docs are up to date and consistent with the implemented features.
