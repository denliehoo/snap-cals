# Spec: Weight Log

## Problem Statement

Users currently track food intake but have no way to log body weight. Weight is a key metric for anyone managing their nutrition — without it, users can't see if their calorie/macro goals are producing results. There's also no way to correlate eating habits with weight trends over time.

## User Stories

1. **As a user**, I want to log my weight from the daily view FAB so I can quickly record it alongside my food entries.
2. **As a user**, I want to choose my preferred weight unit (kg or lbs) in settings so I see values in a unit I'm familiar with.
3. **As a user**, I want to view a line chart of my weight history so I can see trends over time.
4. **As a user**, I want to filter my weight chart by time range (7 days, 30 days, 90 days, all time) so I can focus on the period that matters.
5. **As a user**, I want to edit or delete a past weight entry so I can correct mistakes.
6. **As a user**, I want to add an optional note to a weight entry so I can record context (e.g., "after workout", "morning weigh-in").

## Scope

### In Scope
- Weight logging (date, time, weight value, optional note)
- Dual-unit storage (kg + lbs stored together; user enters in preferred unit, other is computed)
- Weight unit preference in Settings (kg or lbs, persisted via SecureStore in settings store)
- Multiple entries per day allowed
- Date and time pickers defaulting to now, user-adjustable
- Weight History screen with line chart
- Time range filter: 7d, 30d, 90d, All — default 30 days
- Entry list below chart showing individual entries (tap to edit, swipe to delete)
- "Log Weight" action added to daily view FAB action sheet
- Navigation restructure: Goals tab removed from bottom tabs, replaced by Weight tab. Goals becomes a row in the Settings/More screen that navigates to the existing Goals screen.

### Out of Scope (Deferred)
- AI Goal Coach integration with weight data
- Moving average / trend line on chart
- Body fat % or other body measurements
- Custom date range picker
- Weight data export

## Data Model Changes

### New Model: `WeightEntry`

| Field       | Type     | Notes                                          |
|-------------|----------|-------------------------------------------------|
| id          | String   | cuid, primary key                               |
| userId      | String   | FK to User                                      |
| weightKg    | Float    | Weight in kilograms                             |
| weightLbs   | Float    | Weight in pounds                                |
| note        | String?  | Optional note, nullable                         |
| loggedAt    | DateTime | User-selected date+time (defaults to now)       |
| createdAt   | DateTime | Auto-set on creation                            |
| updatedAt   | DateTime | Auto-updated                                    |

- Index on `[userId, loggedAt]` for efficient date-range queries.
- Conversion: 1 kg = 2.20462 lbs. Server computes the counterpart on create/update.

### User Model
No changes. Weight unit preference is client-side only (SecureStore).

## API Changes

### New Routes: `/api/weight`

All routes require JWT auth (same as existing protected routes).

| Method   | Path                | Description                        | Request Body                                                    | Response                          |
|----------|---------------------|------------------------------------|-----------------------------------------------------------------|-----------------------------------|
| `POST`   | `/api/weight`       | Log a weight entry                 | `{ weight: number, unit: "kg" \| "lbs", loggedAt: string, note?: string }` | `{ data: WeightEntry }`          |
| `GET`    | `/api/weight`       | List weight entries for date range | Query: `?from=ISO&to=ISO`                                       | `{ data: WeightEntry[] }`        |
| `PUT`    | `/api/weight/:id`   | Update a weight entry              | `{ weight?: number, unit?: "kg" \| "lbs", loggedAt?: string, note?: string }` | `{ data: WeightEntry }`          |
| `DELETE` | `/api/weight/:id`   | Delete a weight entry              | —                                                               | `{ message: "Deleted" }`         |

- `POST` and `PUT`: server receives the value + unit, computes the other unit, stores both.
- `GET`: `from` and `to` are required ISO date strings. Server filters `loggedAt` within range. Results ordered by `loggedAt` descending.
- `PUT` and `DELETE`: server verifies the entry belongs to the authenticated user (same pattern as food entries).

### Shared Types (to add to `@snap-cals/shared`)

```
type WeightUnit = "kg" | "lbs";

interface WeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  weightLbs: number;
  note: string | null;
  loggedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateWeightEntryRequest {
  weight: number;
  unit: WeightUnit;
  loggedAt: string;
  note?: string;
}

interface UpdateWeightEntryRequest {
  weight?: number;
  unit?: WeightUnit;
  loggedAt?: string;
  note?: string;
}
```

## UI/UX Notes

### FAB Action Sheet (Daily View)
- Add a 4th option: "Log Weight" with `scale-outline` icon (Ionicons).
- Order: Manual Entry, AI Assist, Quick Add, Log Weight.

### Log Weight Screen
- Modal screen (same pattern as EntryForm — pushed on top of tab navigator).
- Fields:
  - **Weight** — numeric input, placeholder shows unit (e.g., "kg" or "lbs" based on preference).
  - **Date** — date picker, defaults to today.
  - **Time** — time picker, defaults to current time.
  - **Note** — optional text input, single line, placeholder "Optional note".
- "Save" button at bottom.
- Validation: weight is required, must be a positive number.

### Navigation Restructure
- Bottom tabs change from: **Daily — Weekly — Goals — More** to: **Daily — Weekly — Weight — More**.
- **Weight tab** opens the Weight History screen (chart + entry list).
- **Goals** becomes a row in the Settings/More screen (icon: `flag-outline`, label: "My Goals") that navigates to the existing Goals screen as a stack screen. The Goals screen itself (form + AI Goal Coach button) remains unchanged.

### Weight History Screen (Weight Tab)
- Top section: time range toggle bar (7d / 30d / 90d / All), default 30d.
- Middle section: line chart plotting weight over time. Y-axis = weight in user's preferred unit. X-axis = dates. Each entry is a dot on the line.
- Bottom section: scrollable list of individual weight entries (most recent first), showing:
  - Weight value (in preferred unit)
  - Date and time
  - Note (if present)
  - Tap to edit (navigates to Log Weight screen pre-filled)
  - Swipe left to delete (with confirmation)

### Settings Changes
- New row under a "Preferences" section: **Weight Unit** — tappable row that toggles between "kg" and "lbs" (or a simple picker). Persisted in SecureStore via the settings Zustand store.
- New row: **My Goals** (icon: `flag-outline`) — navigates to the Goals screen.

## Acceptance Criteria

### Logging
- [ ] User can tap "Log Weight" in the FAB action sheet on the daily view.
- [ ] Log Weight screen shows weight input, date picker (default today), time picker (default now), and optional note field.
- [ ] Weight input respects the user's unit preference (shows "kg" or "lbs" placeholder).
- [ ] Submitting a valid weight creates a `WeightEntry` with both `weightKg` and `weightLbs` correctly computed.
- [ ] Submitting without a weight value shows a validation error.
- [ ] Multiple weight entries can be logged for the same day.
- [ ] After saving, user is navigated back and a success snackbar is shown.

### Unit Preference
- [ ] Settings screen has a "Weight Unit" option under a "Preferences" section.
- [ ] Weight unit defaults to kg on first use. User can switch between kg and lbs; preference persists across app restarts.
- [ ] All weight displays (chart, entry list, log form) reflect the selected unit.

### Weight History
- [ ] Weight tab in bottom navigation shows the Weight History screen.
- [ ] Line chart displays weight entries over time in the user's preferred unit.
- [ ] Time range toggles (7d, 30d, 90d, All) filter the chart and entry list; default is 30d.
- [ ] Entry list below chart shows entries in reverse chronological order with weight, date/time, and note.
- [ ] Tapping an entry opens the Log Weight screen pre-filled for editing.
- [ ] Swiping left on an entry shows a delete action; confirming deletes the entry.
- [ ] Chart and list update after adding, editing, or deleting an entry.
- [ ] Empty state shown when no weight entries exist for the selected range.

### Navigation Restructure
- [ ] Bottom tabs are: Daily, Weekly, Weight, More.
- [ ] Goals tab is removed from bottom tabs.
- [ ] Settings/More screen has a "My Goals" row that navigates to the Goals screen.
- [ ] Goals screen (form + AI Goal Coach button) works the same as before.
- [ ] AI Goal Coach is still accessible from the Goals screen.

### API
- [ ] `POST /api/weight` creates a weight entry and returns it with both kg and lbs values.
- [ ] `GET /api/weight?from=...&to=...` returns entries within the date range, ordered by `loggedAt` descending.
- [ ] `PUT /api/weight/:id` updates the entry (recomputes the counterpart unit if weight/unit changed). Returns 404 if entry doesn't belong to user.
- [ ] `DELETE /api/weight/:id` deletes the entry. Returns 404 if entry doesn't belong to user.
- [ ] All weight routes require JWT authentication.

## Risks & Dependencies

- **Chart library**: The app doesn't currently use a charting library. A dependency like `react-native-chart-kit` or `victory-native` will need to be added. This should be evaluated during implementation for Expo compatibility and bundle size.
- **Navigation restructure**: Moving Goals out of the tab bar changes a core navigation pattern. Existing deep links or navigation calls to `GoalsTab` (e.g., from Goal Coach's "Set as my goals" flow) need to be updated.
- **Goal Coach prefill flow**: Currently Goal Coach navigates back to `GoalsTab` with `prefill` params. After the restructure, this needs to navigate to the Goals screen via the main stack instead. Needs careful testing.
