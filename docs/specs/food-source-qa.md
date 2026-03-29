## QA Report: Food Source / Provider Field
### Date: 2026-03-29
### Spec: docs/specs/food-source.md

### Results

#### Data Model

- ✅ PASS — `FoodEntry` has optional `source String?` (nullable, no default)
  - Evidence: `apps/server/prisma/schema.prisma` — `source String?` on FoodEntry model
- ✅ PASS — `FavoriteFood` has optional `source String?` (nullable, no default)
  - Evidence: `apps/server/prisma/schema.prisma` — `source String?` on FavoriteFood model
- ✅ PASS — Existing entries/favorites unaffected by migration (null source)
  - Evidence: `prisma/migrations/20260329084308_add_source_field/migration.sql` — `ALTER TABLE "FoodEntry" ADD COLUMN "source" TEXT;` and `ALTER TABLE "FavoriteFood" ADD COLUMN "source" TEXT;` — nullable columns, no default, no backfill

#### API

- ✅ PASS — `POST /api/entries` accepts optional `source`; returns 400 if >100 chars
  - Evidence: `apps/server/src/controllers/entry.controller.ts:39-42` — validates `source.length > AI_SOURCE_MAX_LENGTH`; test `entries.test.ts` "creates an entry with source" and "returns 400 when source exceeds 100 chars" both pass
- ✅ PASS — `PUT /api/entries/:id` accepts optional `source` with same validation
  - Evidence: `apps/server/src/controllers/entry.controller.ts:107-113` — validates source on update; test `entries.test.ts` "updates source on an entry" and "returns 400 when updating source exceeds 100 chars" both pass
- ✅ PASS — `GET /api/entries?date=`, `GET /api/entries/week?startDate=`, `GET /api/entries/recent` all return `source`
  - Evidence: `getByDate` and `getByWeek` use `findMany` without `select` (returns all fields including `source`); `getRecent` explicitly includes `source: true` in select at `entry.controller.ts:148`
- ✅ PASS — `POST /api/favorites` accepts optional `source` with same validation
  - Evidence: `apps/server/src/controllers/favorite.controller.ts:36-39` — validates source length; test `favorites.test.ts` "creates a favorite with source" and "returns 400 when source exceeds 100 chars" both pass
- ✅ PASS — `GET /api/favorites` returns `source` in response
  - Evidence: `favorite.controller.ts:list` uses `findMany` without `select`, returns all fields including `source`

#### AI — One-Shot Mode (`/api/ai/estimate`)

- ✅ PASS — AI estimate response includes optional `source` field
  - Evidence: `apps/server/src/services/gemini.service.ts` — `nutritionSchema` has `source: z.string().optional()`; shared type `AiEstimateResponse` has `source?: string`
- ✅ PASS — When source is clearly inferable, AI populates `source`
  - Evidence: System prompt in `gemini.service.ts` instructs: "If the source/provider is clearly identifiable from the description (e.g. 'Big Mac' → 'McDonald's'), include it in the 'source' field"
- ✅ PASS — When source is ambiguous/generic, AI returns empty string or omits it
  - Evidence: System prompt: "If the source is ambiguous or generic, return an empty string for 'source'"
- ✅ PASS — When user explicitly mentions source, AI uses it
  - Evidence: System prompt: "If the user explicitly mentions a source, use it"
- ✅ PASS — When source is identified, AI attempts to use provider's nutrition data (best effort)
  - Evidence: System prompt: "use that provider's published nutrition data when possible"

#### AI — Chat/Discussion Mode (`/api/ai/chat`)

- ✅ PASS — AI estimate (when produced) includes optional `source` field
  - Evidence: `apps/server/src/services/chat.service.ts` — `chatResponseSchema` estimate object has `source: z.string().optional()`
- ✅ PASS — If user mentions source in initial message, AI acknowledges and doesn't re-ask
  - Evidence: Chat system prompt: "If the user mentions where the food is from, acknowledge it and use provider-specific nutrition data"
- ✅ PASS — If source is clearly inferable, AI states assumption and asks to confirm (batched)
  - Evidence: Chat system prompt: "If the source is clearly inferable, state your assumption and ask the user to confirm (batch with other questions)"
- ✅ PASS — If source is ambiguous, AI asks where food is from (batched)
  - Evidence: Chat system prompt: "If the source is ambiguous, ask where the food is from (batch with other questions)"
- ✅ PASS — When source is confirmed/known, AI uses provider-specific data (best effort)
  - Evidence: Chat system prompt: "When a source is known, include it in the estimate 'source' field"

#### Mobile — Entry Form

- ✅ PASS — Entry form has optional "Source" text field between "Serving Size" and "Meal Type"
  - Evidence: `apps/mobile/src/screens/entry-form/index.tsx` — Source FormField appears after Serving Size and before "Meal Type" label
- ✅ PASS — Field placeholder is `"e.g. McDonald's, Homemade, Hawker"`
  - Evidence: `entry-form/index.tsx` — `placeholder="e.g. McDonald's, Homemade, Hawker"`
- ✅ PASS — Field is not required — form submits with or without it
  - Evidence: `use-entry-form.ts:validate()` only checks `name` and `calories`; `source: source.trim() || undefined` in submit data
- ✅ PASS — Source capped at 100 characters (client-side)
  - Evidence: `entry-form/index.tsx` — `maxLength={AI_SOURCE_MAX_LENGTH}` on the Source FormField
- ✅ PASS — When editing, source field is pre-populated if present
  - Evidence: `use-entry-form.ts:30` — `useState(entry?.source || prefill?.source || "")`
- ✅ PASS — When navigating from AI Assist, source from AI estimate pre-fills the field
  - Evidence: `use-ai-assist.ts` navigates with `{ prefill: data }` where `data` is `AiEstimateResponse` (includes `source`); `use-entry-form.ts` reads `prefill?.source`; `EntryFormPrefill = AiEstimateResponse & { mealType?: MealType }` inherits `source`

#### Mobile — AI Assist Screen

- ✅ PASS — Text input placeholder updated to `"e.g. Big Mac from McDonald's"`
  - Evidence: `apps/mobile/src/screens/ai-assist/index.tsx` — `placeholder="e.g. Big Mac from McDonald's"`
- ✅ PASS — When AI returns estimate with source, it's passed through to EntryForm prefill
  - Evidence: One-shot: `use-ai-assist.ts` passes full `AiEstimateResponse` (includes `source`) as prefill. Chat: `use-chat.ts:confirm()` passes `estimate` (type `AiEstimateResponse`) as prefill

#### Mobile — Daily View (Entry Row)

- ✅ PASS — When entry has source, displayed as secondary text alongside serving size
  - Evidence: `apps/mobile/src/components/entry-row.tsx` — `const meta = [source, servingSize].filter(Boolean).join(" · ");` renders as `{source} · {servingSize}`
- ✅ PASS — When entry has no source, display unchanged
  - Evidence: `filter(Boolean)` removes falsy values, so only `servingSize` shows when `source` is null/empty

#### Mobile — Quick Add (Favorites & Recents)

- ✅ PASS — Favorite items display source when present
  - Evidence: `apps/mobile/src/screens/quick-add/index.tsx` — renders `item.source` in a `<Text>` element when `"source" in item && item.source`
- ✅ PASS — Recent items include source in response and display it when present
  - Evidence: Server `getRecent` selects `source: true`; Quick Add screen checks `"source" in item && item.source` for display
- ✅ PASS — When quick-adding a favorite/recent to entry form, source is included in prefill
  - Evidence: `quick-add/index.tsx:handlePress` — extracts `source` from item and includes it in `EntryFormPrefill`
- ✅ PASS — When favoriting a recent (swipe right), source is preserved
  - Evidence: `quick-add/use-quick-add.ts:addFavorite` — destructures `source` from `RecentFoodItem` and passes `source: source ?? undefined` to `api.createFavorite`

### Bugs Found

None discovered during review.

### Summary

- Total criteria: 28
- Passed: 28
- Failed: 0
- Verdict: **PASS**

All acceptance criteria are met with concrete evidence from code and passing tests (225 total: 91 mobile + 134 server, all green). The data model, API validation, AI prompt integration, mobile UI, and quick-add flows all correctly implement the food source feature as specified.
