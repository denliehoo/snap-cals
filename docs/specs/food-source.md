# Food Source / Provider Field

## Problem Statement

Users often eat from specific restaurants, chains, hawker stalls, or cook at home — and the nutrition for the same dish can vary significantly depending on where it comes from. Currently, Snap Cals has no way to capture or use this information. Adding a `source` field improves AI estimate accuracy (by prompting Gemini to use provider-specific nutrition data when available) and gives users better context when reviewing their food log.

## User Stories

1. **As a user logging food manually**, I want an optional "Source" field on the entry form so I can record where my food came from (e.g., "McDonald's", "Homemade", "Hawker").

2. **As a user using AI one-shot mode**, I want the AI to infer the source from my description when it's obvious (e.g., "Big Mac" → "McDonald's") and include it in the estimate, so I don't have to type it separately.

3. **As a user using AI chat/discussion mode**, I want the AI to state its assumption about the source (or ask if it's unclear) early in the conversation, so the estimate can be tailored to the actual provider.

4. **As a user viewing my daily log**, I want to see the source displayed on each entry card (when present), so I can quickly recall where I ate.

5. **As a user with favorites/recents**, I want the source to be preserved when I favorite a food or quick-add from recents, so I don't lose that context.

## Acceptance Criteria

### Data Model

- [ ] `FoodEntry` has an optional `source` field (string, max 100 chars, nullable, defaults to null)
- [ ] `FavoriteFood` has an optional `source` field (string, max 100 chars, nullable, defaults to null)
- [ ] Existing entries and favorites are unaffected by the migration (null source)

### API

- [ ] `POST /api/entries` accepts an optional `source` string; if provided and longer than 100 chars, returns 400
- [ ] `PUT /api/entries/:id` accepts an optional `source` string with the same validation
- [ ] `GET /api/entries?date=`, `GET /api/entries/week?startDate=`, `GET /api/entries/recent` all return `source` in the response
- [ ] `POST /api/favorites` accepts an optional `source` string with the same validation
- [ ] `GET /api/favorites` returns `source` in the response

### AI — One-Shot Mode (`/api/ai/estimate`)

- [ ] The AI estimate response includes an optional `source` field
- [ ] When the source is clearly inferable from the description (e.g., "Big Mac", "Starbucks latte"), the AI populates `source` in the response
- [ ] When the source is ambiguous or generic (e.g., "chicken rice", "salad"), the AI returns `source` as an empty string or omits it
- [ ] When the user explicitly mentions a source in the description (e.g., "chicken rice from Tian Tian"), the AI uses it
- [ ] When a source is identified, the AI attempts to use that provider's published nutrition data (best effort)

### AI — Chat/Discussion Mode (`/api/ai/chat`)

- [ ] The AI estimate (when produced) includes an optional `source` field
- [ ] If the user mentions the source in their initial message, the AI acknowledges it and uses it — does not re-ask
- [ ] If the source is clearly inferable, the AI states its assumption and asks the user to confirm (batched with other clarifying questions to reduce back-and-forth)
- [ ] If the source is ambiguous, the AI asks where the food is from (batched with other clarifying questions)
- [ ] When a source is confirmed/known, the AI attempts to use that provider's published nutrition data (best effort)

### Mobile — Entry Form

- [ ] The entry form has an optional "Source" text field between "Serving Size" and "Meal Type"
- [ ] The field placeholder is descriptive (e.g., "e.g. McDonald's, Homemade, Hawker")
- [ ] The field is not required — form submits successfully with or without it
- [ ] Source is capped at 100 characters (client-side)
- [ ] When editing an existing entry, the source field is pre-populated if present
- [ ] When navigating from AI Assist (one-shot or chat), the source from the AI estimate pre-fills the field

### Mobile — AI Assist Screen

- [ ] The text input placeholder is updated to be more descriptive (e.g., "e.g. Big Mac from McDonald's")
- [ ] When the AI returns an estimate with a source, it is passed through to the EntryForm prefill

### Mobile — Daily View (Entry Row)

- [ ] When an entry has a source, it is displayed as secondary text (alongside serving size)
- [ ] When an entry has no source, the display is unchanged from current behavior

### Mobile — Quick Add (Favorites & Recents)

- [ ] Favorite items display source when present
- [ ] Recent items include source in the response and display it when present
- [ ] When quick-adding a favorite or recent to the entry form, the source is included in the prefill
- [ ] When favoriting a recent food (swipe right), the source is preserved

## Data Model Changes

### `FoodEntry` model

Add field:
- `source String?` — nullable, no default

### `FavoriteFood` model

Add field:
- `source String?` — nullable, no default

### Shared types (`@snap-cals/shared`)

- Add `source?: string` to: `FoodEntry`, `FavoriteFoodItem`, `RecentFoodItem`, `CreateFoodEntryRequest`, `UpdateFoodEntryRequest`, `CreateFavoriteFoodRequest`, `AiEstimateResponse`, `EntryFormPrefill`
- Add `AI_SOURCE_MAX_LENGTH = 100` constant

## API Changes

### Modified Endpoints

| Endpoint | Change |
|----------|--------|
| `POST /api/entries` | Accept optional `source` (string, max 100 chars) |
| `PUT /api/entries/:id` | Accept optional `source` (string, max 100 chars) |
| `GET /api/entries?date=` | Return `source` in each entry |
| `GET /api/entries/week?startDate=` | Return `source` in each entry |
| `GET /api/entries/recent` | Return `source` in select fields |
| `POST /api/favorites` | Accept optional `source` (string, max 100 chars) |
| `GET /api/favorites` | Return `source` in each favorite |
| `POST /api/ai/estimate` | Response includes optional `source` |
| `POST /api/ai/chat` | Estimate in response includes optional `source` |

### No new endpoints required.

## AI Prompt Changes

### One-shot (`gemini.service.ts`)

- Add `source` to the nutrition schema (optional string)
- Update system prompt to instruct the AI to infer the source when clearly identifiable, use provider-specific nutrition data when a source is known, and return an empty string when the source is ambiguous

### Chat (`chat.service.ts`)

- Add `source` to the estimate object in the chat response schema (optional string)
- Update system prompt to:
  - Recognize when the user has already mentioned a source and not re-ask
  - State assumptions about the source when inferable, batched with other clarifying questions
  - Ask about the source when ambiguous, batched with other clarifying questions
  - Use provider-specific nutrition data when a source is known (best effort)

## UI/UX Notes

- Source field placement on entry form: between "Serving Size" and "Meal Type" — it's contextually related to serving info and should be filled before selecting meal type
- Entry row display format when source is present: `{source} · {servingSize}` on the meta line (if both exist), or just `{source}` or `{servingSize}` alone
- Quick Add cards follow the same display pattern as entry rows
- No special UI for "Homemade" or "Unknown" — these are just free-text values the user can type
- AI Assist input placeholder change: `"e.g. Big Mac from McDonald's"` (encourages users to include source naturally)
- Manual entry source field placeholder: `"e.g. McDonald's, Homemade, Hawker"`

## Risks & Dependencies

- **AI accuracy**: Gemini's knowledge of specific restaurant/chain nutrition data is best-effort. The AI may not have accurate data for local or regional chains. No disclaimer is needed — users can always edit values before saving.
- **Token cost**: In chat mode, asking about the source adds to the conversation. Mitigated by batching the source question with other clarifying questions rather than asking it in isolation.
- **Migration**: Adding a nullable column is a safe, non-breaking migration. No backfill needed.
- **Field length limits**: This feature introduces a 100-char limit on `source`. The known bug about unlimited field lengths on other fields (name, servingSize, etc.) is out of scope for this feature but should be addressed separately.
