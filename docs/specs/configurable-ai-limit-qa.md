## QA Report: Configurable AI Daily Limit

### Date: 2026-05-03

### Spec: docs/specs/configurable-ai-limit.md

### Results

#### Admin Database

- ✅ **Seed script inserts default `freeDailyAiLimit` row with value `"3"`**
  Evidence: `apps/server/prisma/admin-seed.ts:30-34` — upserts `{ key: "freeDailyAiLimit", value: "3" }`.

- ✅ **Server falls back to `3` if the row doesn't exist**
  Evidence: `apps/server/src/services/settings.service.ts:33-34` — if `setting` is null, `Number.parseInt(undefined)` returns `NaN`, and the fallback `FREE_DAILY_AI_LIMIT` (which is `3`) is used.

#### Admin API

- ✅ **`GET /api/admin/settings` returns `freeDailyAiLimit` as a number**
  Evidence: `apps/server/src/controllers/admin-settings.controller.ts:12` — `parseSettings` uses `Number.parseInt` to convert the string value. Test `configurable-ai-limit.test.ts:50-54` asserts `typeof res.body.data.freeDailyAiLimit` is `"number"` and value is `3`.

- ✅ **`PUT /api/admin/settings` accepts `{ freeDailyAiLimit: 5 }` and persists it**
  Evidence: `admin-settings.controller.ts:37-44` — upserts the value. Test `configurable-ai-limit.test.ts:58-63` asserts status 200 and returned value is `5`.

- ✅ **`PUT /api/admin/settings` rejects values outside 1–20 with 400**
  Evidence: `admin-settings.controller.ts:26-30` — checks `val < 1 || val > 20`. Tests `configurable-ai-limit.test.ts:65-74` assert 400 for `0` and `21`.

- ✅ **`PUT /api/admin/settings` rejects non-integer values with 400**
  Evidence: `admin-settings.controller.ts:26` — checks `!Number.isInteger(val)`. Test `configurable-ai-limit.test.ts:76-81` asserts 400 for `3.5`.

- ✅ **Updating `freeDailyAiLimit` clears the server-side settings cache**
  Evidence: `admin-settings.controller.ts:50` — calls `clearSettingsCache()` after persisting. Test `configurable-ai-limit.test.ts:83-95` updates limit to 10, then verifies `GET /api/usage` returns `limit: 10`.

#### Admin Dashboard

- ✅ **Platform Settings page displays "Free Daily AI Limit" row below "Allow New Signups"**
  Evidence: `apps/admin/src/pages/settings/index.tsx:55-80` — second card div with label "Free Daily AI Limit" appears after the signup toggle card.

- ✅ **Row contains label, description, number input, and Save button**
  Evidence: `index.tsx:58-59` — label "Free Daily AI Limit", description "Max AI lookups per day for free users". Line 68: `<input type="number">`. Line 72: `<button>Save</button>`.

- ✅ **Number input is pre-populated with current value from API**
  Evidence: `index.tsx:17-19` — on first load when `settings` is available and `!initialized`, sets `aiLimitInput` to `String(settings.freeDailyAiLimit)`.

- ✅ **Save button disabled when value matches current or is invalid**
  Evidence: `index.tsx:25` — `canSaveLimit = isValidLimit && isLimitChanged`. Button at line 73 has `disabled={!canSaveLimit || saving}`.

- ✅ **Clicking Save opens a confirmation modal showing old and new values**
  Evidence: `index.tsx:73` — `onClick={() => setAiLimitConfirmOpen(true)}`. Modal at lines 103-113 shows message `"Free users will get ${parsedLimit} AI lookups per day (currently ${settings?.freeDailyAiLimit})."`.

- ✅ **Confirming the modal calls `PUT /api/admin/settings` and updates displayed value**
  Evidence: `index.tsx:111-113` — `onConfirm` calls `update({ freeDailyAiLimit: parsedLimit })`. The `useSettings` hook's `update` function (`use-settings.ts:28-37`) calls `put("/admin/settings", updates)` and sets the response to `settings` state.

- ✅ **Error message shown if update fails**
  Evidence: `use-settings.ts:35` — catch block calls `show("Failed to save settings", "error")` via toast. Also `index.tsx:40` renders `error` state as red text.

- ✅ **Client-side validation: whole number 1–20, inline error, Save disabled**
  Evidence: `index.tsx:28-33` — `handleAiLimitChange` checks `!Number.isInteger(num) || num < 1 || num > 20` and sets `aiLimitError`. Lines 21-25 compute `isValidLimit` which gates `canSaveLimit`.

#### Server Enforcement

- ✅ **`checkAiUsage` middleware reads limit from admin DB via cached settings service**
  Evidence: `apps/server/src/middleware/ai-usage.ts:2` — imports `getFreeDailyAiLimit` from settings service. Line 16: `const limit = await getFreeDailyAiLimit()`.

- ✅ **Settings service caches with 60-second TTL (same pattern as `signupEnabled`)**
  Evidence: `apps/server/src/services/settings.service.ts:4` — `CACHE_TTL_MS = 60_000`. Line 27: `cachedFreeDailyAiLimit !== null && now - cacheTimestamp < CACHE_TTL_MS` check mirrors the `isSignupEnabled` pattern.

- ✅ **Falls back to `FREE_DAILY_AI_LIMIT` if admin DB is unreachable**
  Evidence: `settings.service.ts:40-41` — catch block returns `FREE_DAILY_AI_LIMIT`.

- ✅ **`GET /api/usage` returns the configured limit dynamically**
  Evidence: `apps/server/src/controllers/usage.controller.ts:11` — `const limit = await getFreeDailyAiLimit()`. Test `configurable-ai-limit.test.ts:100-114` sets DB value to `"7"`, clears cache, and asserts `res.body.data.limit` is `7`.

- ✅ **New value enforced on next AI request after cache expires**
  Evidence: `configurable-ai-limit.test.ts:116-140` — sets limit to 1, clears cache, first AI request succeeds (200), second is blocked (429) with `limit: 1`.

#### Mobile App

- ✅ **`usage-limit-modal.tsx` uses store limit instead of importing `FREE_DAILY_AI_LIMIT`**
  Evidence: `apps/mobile/src/components/usage-limit-modal.tsx:8` — imports `useUsageStore`. Line 24: `const limit = useUsageStore((s) => s.limit)`. No import of `FREE_DAILY_AI_LIMIT` in the file.

- ✅ **Usage store default `limit` is `FREE_DAILY_AI_LIMIT` as fallback**
  Evidence: `apps/mobile/src/stores/usage.store.ts:1` — imports `FREE_DAILY_AI_LIMIT`. Line 15: `limit: FREE_DAILY_AI_LIMIT`.

- ✅ **No other mobile changes needed**
  Evidence: The limit flows from `GET /api/usage` → `usage.store.ts:fetch()` → UI. The store's `fetch` sets `limit: data.limit` from the server response.

#### Shared Package

- ✅ **`FREE_DAILY_AI_LIMIT` remains in `constants.ts`**
  Evidence: `packages/shared/src/constants.ts:1` — `export const FREE_DAILY_AI_LIMIT = 3`.

- ✅ **`PlatformSettings` interface includes `freeDailyAiLimit: number`**
  Evidence: `packages/shared/src/admin.ts:60` — `freeDailyAiLimit: number`.

- ✅ **`UpdatePlatformSettingsRequest` interface includes `freeDailyAiLimit?: number`**
  Evidence: `packages/shared/src/admin.ts:65` — `freeDailyAiLimit?: number`.

### Bugs Found

None.

### Summary

- Total criteria: 24
- Passed: 24
- Failed: 0
- Verdict: **PASS**
