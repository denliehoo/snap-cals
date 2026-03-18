# Phase 5: Quick Features — Implementation Plan

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

- [ ] **Objective:** Add the `FavoriteFood` model and CRUD API endpoints
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

- [ ] **Objective:** Add an endpoint that returns the last 20 unique foods logged by the user
- **Implementation:**
  - Add `getRecent` to `src/controllers/entry.controller.ts` — query `FoodEntry` for the user, ordered by `createdAt desc`, deduplicate by `name` (take the most recent entry per unique name), limit 20
  - Add `GET /recent` route to `entry.routes.ts`
  - Add `RecentFoodItem` type to shared package (same shape as `FavoriteFoodItem` — name, calories, protein, carbs, fat, servingSize, mealType)
- **Test:** Add test in `src/__tests__/entries.test.ts` — log multiple entries with some duplicate names, verify `/entries/recent` returns deduplicated list ordered by most recent, max 20
- **Demo:** Seed some entries, `curl /api/entries/recent` — see deduplicated recent foods.

### Task 3: Mobile API layer + Quick Add screen

- [ ] **Objective:** Build the Quick Add screen showing favorites and recents, accessible from the FAB action sheet
- **Implementation:**
  - Add `getFavorites`, `createFavorite`, `deleteFavorite`, `getRecentFoods` to `api.ts`
  - Create `src/screens/quick-add/` with `index.tsx` and `use-quick-add.ts`
  - `use-quick-add.ts`: fetches favorites and recents on mount, exposes `addFavorite`, `removeFavorite`, loading states
  - `index.tsx`: Two sections (Favorites, Recents) using `SectionList`. Each row shows food name, calories, macros (reuse `EntryRow`-like layout). Tapping a row navigates to `EntryForm` with `prefill` data. Empty states for each section.
  - Add `QuickAdd` to `MainStackParamList` in `navigation.tsx` and register the screen
  - Add "Quick Add" option (with `star-outline` icon) to the FAB action sheet in Daily View
- **Test:** Write test for Quick Add screen — renders favorites and recents sections, tapping an item navigates to EntryForm
- **Demo:** Open app → tap FAB → "Quick Add" → see favorites and recents → tap one → lands on EntryForm pre-filled.

### Task 4: Favorite toggle from Entry Row

- [ ] **Objective:** Let users favorite/unfavorite foods directly from the daily view
- **Implementation:**
  - Add a heart icon to `EntryRow` component — filled heart if the food name matches a favorite, outline if not
  - Tapping the heart calls `createFavorite` or `deleteFavorite` via the API
  - In `use-daily-entries.ts`, fetch the user's favorites list alongside daily entries so we can check which names are favorited
  - Show a snackbar on favorite/unfavorite ("Added to favorites" / "Removed from favorites")
- **Test:** Test that heart icon renders, toggles state on press
- **Demo:** On daily view, tap heart on an entry → snackbar "Added to favorites" → go to Quick Add → see it in Favorites section.

### Task 5: Picture Preview & Crop screen

- [ ] **Objective:** After taking/picking a photo, show a preview where the user can crop before proceeding
- **Implementation:**
  - Install `expo-image-manipulator` for crop operations
  - Create `src/screens/image-preview/index.tsx` — shows the picked image full-width, with a crop overlay/gesture, and "Use Photo" / "Cancel" buttons
  - Add `ImagePreview` to `MainStackParamList` with params `{ uri: string, base64: string, mimeType: string }`
  - Modify `use-image-picker.ts` — instead of setting the image directly, navigate to the ImagePreview screen with the picked image data
  - On "Use Photo" (after optional crop), navigate back to AiAssist with the final image data via route params or a shared state
  - On "Cancel", navigate back without setting an image
- **Test:** Test that ImagePreview screen renders with the image, "Use Photo" and "Cancel" buttons work
- **Demo:** On AI Assist → tap camera → take photo → see preview screen → crop → tap "Use Photo" → back on AI Assist with cropped image thumbnail.

### Task 6: Update docs + Kiro skills

- [ ] **Objective:** Update architecture docs, phase roadmap, and Kiro skills to reflect Phase 5 changes
- **Implementation:**
  - Update `docs/architecture.md` with FavoriteFood model, new API routes, Quick Add screen, image preview flow
  - Mark tasks in this file as completed
  - Update `docs/phase-roadmap.md` Phase 5 status to "Completed"
  - Update `.kiro/skills/mobile-conventions.md` if any new patterns emerged
- **Test:** N/A (docs only)
- **Demo:** All docs are up to date and consistent with the implemented features.
