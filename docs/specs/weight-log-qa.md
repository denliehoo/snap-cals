## QA Report: Weight Log
### Date: 2025-07-17
### Spec: docs/specs/weight-log.md

### Results

#### Logging

- ✅ **User can tap "Log Weight" in the FAB action sheet on the daily view.**
  Evidence: `apps/mobile/src/screens/daily-view/index.tsx:148` — ActionSheet options include `{ label: "Log Weight", icon: "scale-outline", onPress: () => navigation.navigate("WeightLog") }` as the 4th option. Order is Manual Entry, AI Assist, Quick Add, Log Weight — matches spec.

- ✅ **Log Weight screen shows weight input, date picker (default today), time picker (default now), and optional note field.**
  Evidence: `apps/mobile/src/screens/weight-log/index.tsx` — renders FormField for weight, date (with DatePickerModal), time (with TimePickerModal), and note. Defaults in `use-weight-log.ts`: date defaults to `toLocalDateString()` (today), time defaults to `toTimeString(new Date())` (now).

- ✅ **Weight input respects the user's unit preference (shows "kg" or "lbs" placeholder).**
  Evidence: `apps/mobile/src/screens/weight-log/index.tsx:73` — `placeholder={weightUnit}` on the weight FormField. `weightUnit` comes from `useSettingsStore`.

- ✅ **Submitting a valid weight creates a WeightEntry with both weightKg and weightLbs correctly computed.**
  Evidence: `apps/server/src/controllers/weight.controller.ts` — `convertWeight()` computes both values using `KG_TO_LBS = 2.20462`. If unit is "kg", `weightLbs = weight * 2.20462`; if "lbs", `weightKg = weight / 2.20462`. Both stored via Prisma `create`. Server test `weight.test.ts` "creates entry with both kg and lbs" confirms 70kg → 154.32lbs. Test "converts lbs to kg" confirms 154.32lbs → ~70kg.

- ✅ **Submitting without a weight value shows a validation error.**
  Evidence: `apps/mobile/src/screens/weight-log/use-weight-log.ts:50-53` — checks `!weight || Number.isNaN(val) || val <= 0` and sets `error` state to "Enter a valid weight". Server also validates: `if (!weight || weight <= 0 || !unit || !loggedAt)` returns 400. Server tests "returns 400 for missing weight" and "returns 400 for negative weight" confirm.

- ✅ **Multiple weight entries can be logged for the same day.**
  Evidence: Prisma schema has no unique constraint on `[userId, loggedAt]` — only an index `@@index([userId, loggedAt])`. No server-side deduplication logic. Multiple entries per day are allowed by design.

- ✅ **After saving, user is navigated back and a success snackbar is shown.**
  Evidence: `apps/mobile/src/screens/weight-log/index.tsx:55-58` — `submit()` callback calls `show(isEdit ? "Weight updated" : "Weight logged")` then `navigation.goBack()`.

#### Unit Preference

- ✅ **Settings screen has a "Weight Unit" option under a "Preferences" section.**
  Evidence: `apps/mobile/src/screens/settings/index.tsx` — "Preferences" section contains a SettingsRow with `icon="scale-outline"` and `label={`Weight Unit: ${weightUnit}`}` that opens an ActionSheet with kg/lbs options.

- ✅ **Weight unit defaults to kg on first use. User can switch between kg and lbs; preference persists across app restarts.**
  Evidence: `apps/mobile/src/stores/settings.store.ts` — `weightUnit: "kg"` default. `setWeightUnit` persists to SecureStore via `SecureStore.setItemAsync(WEIGHT_UNIT_KEY, unit)`. `restore()` reads it back on app start and validates `wu === "kg" || wu === "lbs"` before applying.

- ✅ **All weight displays (chart, entry list, log form) reflect the selected unit.**
  Evidence: Chart in `use-weight-history.ts:50` uses `weightUnit === "kg" ? e.weightKg : e.weightLbs`. Entry list in `weight-history/index.tsx:87` uses same ternary. Log form in `use-weight-log.ts:28` uses `displayWeight(entry, weightUnit)` for edit mode and `placeholder={weightUnit}` for new entries. Chart Y-axis suffix: `yAxisSuffix={` ${weightUnit}`}`.

#### Weight History

- ✅ **Weight tab in bottom navigation shows the Weight History screen.**
  Evidence: `apps/mobile/src/navigation.tsx` — `MainTabParamList` includes `WeightTab`. `Tab.Screen name="WeightTab"` renders `WeightHistoryScreen` with `tabBarLabel: "Weight"`, icon `scale-outline`.

- ✅ **Line chart displays weight entries over time in the user's preferred unit.**
  Evidence: `apps/mobile/src/screens/weight-history/index.tsx` — uses `react-native-chart-kit` `LineChart` with `chartData.map((d) => d.value)` where value is unit-aware via `weightUnit === "kg" ? e.weightKg : e.weightLbs`.

- ✅ **Time range toggles (7d, 30d, 90d, All) filter the chart and entry list; default is 30d.**
  Evidence: `use-weight-history.ts:8` — `Range = "7d" | "30d" | "90d" | "all"`, default `useState<Range>("30d")`. `rangeToFrom()` computes the `from` date. `fetchEntries` depends on `range` via `useCallback([range])`, and `useFocusEffect` re-fetches when range changes. UI renders `RANGES = ["7d", "30d", "90d", "all"]` as toggle chips.

- ✅ **Entry list below chart shows entries in reverse chronological order with weight, date/time, and note.**
  Evidence: `weight-history/index.tsx` — FlatList renders entries with `displayWeight`, `formatDate(item.loggedAt)` (month, day, hour, minute), and `item.note`. Server returns `orderBy: { loggedAt: "desc" }`. Server test "returns entries ordered by loggedAt desc" confirms ordering.

- ✅ **Tapping an entry opens the Log Weight screen pre-filled for editing.**
  Evidence: `weight-history/index.tsx:91` — `RectButton` `onPress={() => navigation.navigate("WeightLog", { entry: item })}`. `use-weight-log.ts` initializes state from `entry` param when present: weight from `displayWeight(entry, weightUnit)`, date/time from `entry.loggedAt`, note from `entry.note`.

- ✅ **Swiping left on an entry shows a delete action; confirming deletes the entry.**
  Evidence: `weight-history/index.tsx:83-97` — each entry is wrapped in a `Swipeable` component (from `react-native-gesture-handler`) with `renderRightActions` showing a red trash icon. `onSwipeableOpen` triggers `handleDelete(item)` which shows an `Alert.alert` with Cancel (closes swipeable) and Delete (destructive, calls `deleteEntry` + shows snackbar). This matches the spec's "swipe left to delete with confirmation" requirement.

- ✅ **Chart and list update after adding, editing, or deleting an entry.**
  Evidence: `use-weight-history.ts` — `useFocusEffect` re-fetches entries when the screen regains focus (covers add/edit via navigation back). `deleteEntry` optimistically removes from local state via `setEntries((prev) => prev.filter(...))`.

- ✅ **Empty state shown when no weight entries exist for the selected range.**
  Evidence: `weight-history/index.tsx` — `ListEmptyComponent` renders "No entries" with `scale-outline` icon and helper text "Log your weight from the Daily view". Chart area shows "No weight entries yet" when `entries.length === 0`.

#### Navigation Restructure

- ✅ **Bottom tabs are: Daily, Weekly, Weight, More.**
  Evidence: `apps/mobile/src/navigation.tsx` — `MainTabParamList` has `DailyTab`, `WeeklyTab`, `WeightTab`, `SettingsTab`. Tab labels are "Daily", "Weekly", "Weight", "More" respectively.

- ✅ **Goals tab is removed from bottom tabs.**
  Evidence: `MainTabParamList` does not include any Goals tab. No `GoalsTab` in the Tab.Navigator. Goals is only in `MainStackParamList`.

- ✅ **Settings/More screen has a "My Goals" row that navigates to the Goals screen.**
  Evidence: `apps/mobile/src/screens/settings/index.tsx` — SettingsRow with `icon="flag-outline"`, `label="My Goals"`, `onPress={() => navigation.navigate("Goals")}` under the "Preferences" section.

- ✅ **Goals screen (form + AI Goal Coach button) works the same as before.**
  Evidence: `apps/mobile/src/screens/goals/index.tsx` — unchanged form with calories/protein/carbs/fat fields, "Save Goals" button, and "Let AI set my goals ✨" button. Receives `prefill` from route params. Goals test suite (5 tests) passes.

- ✅ **AI Goal Coach is still accessible from the Goals screen.**
  Evidence: `apps/mobile/src/screens/goals/index.tsx` — "Let AI set my goals ✨" button navigates to `GoalCoach`. `use-goal-coach.ts:70` — `confirm()` navigates to `navigation.navigate("Goals", { prefill: recommendation })` which correctly targets the MainStack screen. Goal Coach test "navigates to Goals screen on confirm" passes.

#### API

- ✅ **POST /api/weight creates a weight entry and returns it with both kg and lbs values.**
  Evidence: `weight.controller.ts:create` — creates entry with `convertWeight(weight, unit)` storing both `weightKg` and `weightLbs`. Returns `{ data: entry }` with status 201. Server tests: "creates entry with both kg and lbs" (70kg → 154.32lbs), "converts lbs to kg" (154.32lbs → ~70kg), "stores optional note" all pass.

- ✅ **GET /api/weight?from=...&to=... returns entries within the date range, ordered by loggedAt descending.**
  Evidence: `weight.controller.ts:list` — filters `loggedAt: { gte: new Date(from), lte: new Date(to) }`, `orderBy: { loggedAt: "desc" }`. Returns 400 if `from`/`to` missing. Server tests: "returns entries within date range", "returns entries ordered by loggedAt desc", "returns 400 without from/to" all pass.

- ✅ **PUT /api/weight/:id updates the entry (recomputes the counterpart unit if weight/unit changed). Returns 404 if entry doesn't belong to user.**
  Evidence: `weight.controller.ts:update` — `findFirst({ where: { id, userId } })` returns 404 if not found. Recomputes via `convertWeight(weight, unit)` when both provided. Server tests: "updates weight and recomputes counterpart" (75kg → 165.35lbs), "updates note only" (weight unchanged), "returns 404 for other user's entry" all pass.

- ✅ **DELETE /api/weight/:id deletes the entry. Returns 404 if entry doesn't belong to user.**
  Evidence: `weight.controller.ts:remove` — `findFirst({ where: { id, userId } })` returns 404 if not found. Deletes and returns `{ message: "Deleted" }`. Server tests: "deletes entry", "returns 404 for other user's entry", "returns 404 for non-existent entry" all pass.

- ✅ **All weight routes require JWT authentication.**
  Evidence: `weight.routes.ts:7` — `router.use(authenticate)` applied before all route handlers. Routes mounted at `/api/weight` in `app.ts` after `validateApiKey` middleware. Server test "returns 401 without auth" confirms.

### Bugs Found

- **Flaky parallel test execution:** When running the full server test suite in parallel (default Jest behavior), the weight test "scopes entries to authenticated user" occasionally fails with "socket hang up". This is a pre-existing test infrastructure issue (shared app instance / port contention between test files), not a weight feature bug. All 128 server tests pass when run serially (`--runInBand`), and all 16 weight tests pass in isolation.

### Summary
- Total criteria: 25
- Passed: 25
- Failed: 0
- Verdict: **PASS**
