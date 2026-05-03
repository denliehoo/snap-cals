# Configurable AI Daily Limit

## Problem Statement

The free-tier daily AI lookup limit (`FREE_DAILY_AI_LIMIT = 3`) is hardcoded in the shared constants package. Changing it requires a code change and redeployment to both server and mobile. The admin already has a Platform Settings page for operational toggles (`signupEnabled`). The AI limit should be a platform setting so admins can adjust it instantly from the dashboard without redeploying.

## User Stories

1. **As an admin**, I want to change the daily AI lookup limit for free users from the admin dashboard so I can experiment with different values (e.g., 3 vs 5 vs 10) without redeploying.

2. **As a free user**, I want to see the correct current limit in the usage modal and usage display so I know exactly how many AI lookups I have per day.

## Scope

- New `freeDailyAiLimit` row in the existing `PlatformSetting` table (admin DB), default value `3`
- Admin settings page gets a number input (1–20) with save button and confirmation modal
- Server reads the limit from admin DB (cached) instead of importing the shared constant
- Mobile app already receives the limit from `GET /api/usage` — just needs to stop importing the hardcoded constant for display purposes

### Out of Scope

- Per-user or per-tier configurable limits (this is a single global value for all free users)
- Configuring other constants (field length limits, image size, etc.) — those are structural, not operational
- New API endpoints — the limit already flows through `GET /api/usage` (authenticated) and `GET /api/admin/settings` (admin)

## Acceptance Criteria

### Admin Database

- [ ] The admin seed script inserts a default `PlatformSetting` row: `key: "freeDailyAiLimit"`, `value: "3"`
- [ ] If the row doesn't exist (e.g., existing deployment before this feature), the server falls back to `3`

### Admin API

- [ ] `GET /api/admin/settings` returns `freeDailyAiLimit` as a number alongside `signupEnabled` (e.g., `{ signupEnabled: true, freeDailyAiLimit: 3 }`)
- [ ] `PUT /api/admin/settings` accepts `{ freeDailyAiLimit: 5 }` and persists it
- [ ] `PUT /api/admin/settings` rejects `freeDailyAiLimit` values outside 1–20 with a 400 error
- [ ] `PUT /api/admin/settings` rejects non-integer `freeDailyAiLimit` values (e.g., 3.5) with a 400 error
- [ ] Updating `freeDailyAiLimit` clears the server-side settings cache so the new value takes effect within the next request

### Admin Dashboard

- [ ] The Platform Settings page displays a "Free Daily AI Limit" row below the existing "Allow New Signups" toggle
- [ ] The row contains: label ("Free Daily AI Limit"), description ("Max AI lookups per day for free users"), a number input, and a Save button
- [ ] The number input is pre-populated with the current value from the API
- [ ] The Save button is disabled when the input value matches the current saved value or is invalid
- [ ] Clicking Save opens a confirmation modal (using the existing `ConfirmModal` component) showing the old and new values
- [ ] Confirming the modal calls `PUT /api/admin/settings` and updates the displayed value on success
- [ ] An error message is shown if the update fails
- [ ] Client-side validation: input must be a whole number between 1 and 20; invalid values show an inline error and disable Save

### Server Enforcement

- [ ] The `checkAiUsage` middleware reads the free daily AI limit from the admin DB (via a cached settings service function) instead of importing `FREE_DAILY_AI_LIMIT`
- [ ] The settings service caches the value with the same TTL pattern as `signupEnabled` (60-second in-memory cache)
- [ ] If the admin DB is unreachable, the server falls back to `FREE_DAILY_AI_LIMIT` from the shared constants (fail-safe)
- [ ] `GET /api/usage` returns the current configured limit in the `limit` field (already exists in the response shape — value just changes from hardcoded to dynamic)
- [ ] When the admin changes the limit, the new value is enforced on the next AI request after the cache expires (up to 60 seconds delay — acceptable)

### Mobile App

- [ ] The `usage-limit-modal.tsx` displays the limit from the usage store (`limit` field, already server-driven) instead of importing `FREE_DAILY_AI_LIMIT`
- [ ] The usage store's default `limit` value remains `FREE_DAILY_AI_LIMIT` as a fallback before the first API fetch
- [ ] No other mobile changes are needed — the limit already flows from `GET /api/usage` → usage store → UI

### Shared Package

- [ ] `FREE_DAILY_AI_LIMIT` remains in `constants.ts` as a default/fallback value — it is NOT removed
- [ ] `PlatformSettings` interface adds `freeDailyAiLimit: number`
- [ ] `UpdatePlatformSettingsRequest` interface adds `freeDailyAiLimit?: number`

## Data Model Changes

### Admin Database

No schema changes — uses the existing `PlatformSetting` key-value table.

New seed row:

| key                  | value |
|----------------------|-------|
| `freeDailyAiLimit`   | `"3"` |

### App Database

No changes.

## API Changes

### Modified Endpoints

| Endpoint                    | Change                                                                                     |
|-----------------------------|--------------------------------------------------------------------------------------------|
| `GET /api/admin/settings`   | Response now includes `freeDailyAiLimit: number` alongside `signupEnabled`                 |
| `PUT /api/admin/settings`   | Accepts optional `freeDailyAiLimit` (integer, 1–20); validates and persists                |
| `GET /api/usage`            | `limit` field now returns the configured value from admin DB instead of the hardcoded constant |

### No New Endpoints

The AI limit does not need a public endpoint (unlike `signupEnabled`). It is only relevant to authenticated users and is already included in the `GET /api/usage` response.

## UI/UX Notes

### Admin Dashboard — Platform Settings Page

New row below the existing "Allow New Signups" toggle:

```
┌──────────────────────────────────────────────────────┐
│ Free Daily AI Limit                    [ 3  ] [Save] │
│ Max AI lookups per day for free users                │
└──────────────────────────────────────────────────────┘
```

- Same card styling as the signup toggle row (`bg-gray-900`, `border-gray-800`, `p-4`)
- Number input: `type="number"`, min 1, max 20, integer only
- Save button: right-aligned next to the input, disabled when value is unchanged or invalid
- Confirmation modal on save: "Change AI Limit?" / "Free users will get {newValue} AI lookups per day (currently {oldValue})." / Confirm button: "Update"
- Inline validation error below the input if value is out of range or not a whole number

### Mobile App

No UI changes. The usage limit modal and usage display already read `limit` from the usage store, which is populated from the server. The only change is removing the direct import of `FREE_DAILY_AI_LIMIT` in `usage-limit-modal.tsx` and using the store value instead.

## Risks & Dependencies

- **Admin DB dependency**: Same risk as `signupEnabled` — if the admin DB is unreachable, the server must fall back to the hardcoded default (`FREE_DAILY_AI_LIMIT = 3`). The existing fail-safe pattern in `settings.service.ts` handles this.
- **Cache delay**: Up to 60 seconds between an admin changing the limit and the server enforcing it. Acceptable — same tradeoff as the signup toggle.
- **Existing users mid-day**: If the admin lowers the limit (e.g., 5 → 3) and a free user has already used 4 lookups today, they'll be blocked on their next request. This is expected behavior — no need to grandfather existing usage for the day.
- **Admin settings controller**: The current `getSettings` controller parses all values as booleans (`row.value === "true"`). This needs to change to handle numeric values for `freeDailyAiLimit`. The controller should parse values based on the key or use a more flexible serialization approach.
