# QA Report: Signup Toggle

### Date: 2026-05-02
### Spec: docs/specs/signup-toggle.md

## Results

### Admin Database

- ✅ **PlatformSetting model exists** — `prisma/admin/schema.prisma` defines `PlatformSetting` with `key` (String, `@id`), `value` (String), `updatedAt` (DateTime, `@updatedAt`). The `@id` makes `key` unique and primary key, matching the spec.
- ✅ **Seed inserts default row** — `prisma/admin-seed.ts` upserts `{ key: "signupEnabled", value: "true" }`. Migration `20260502043410_add_platform_setting` creates the table.

### Admin API

- ✅ **GET /api/admin/settings returns key-value object** — `admin-settings.controller.ts:getSettings` queries all `PlatformSetting` rows and returns `{ data: { signupEnabled: true/false } }`. Test `GET /api/admin/settings → returns platform settings` confirms (signup-toggle.test.ts:65).
- ✅ **PUT /api/admin/settings accepts partial updates** — `admin-settings.controller.ts:updateSettings` checks `updates.signupEnabled !== undefined` and upserts. Tests confirm toggling to false (line 78) and back to true (line 84).
- ✅ **Both endpoints protected by authenticateAdmin** — `admin.routes.ts` mounts `router.use(authenticateAdmin)` before the settings routes. Test at line 72 confirms 401 without admin auth.
- ✅ **PUT returns updated settings object** — Controller re-queries all rows after update and returns `{ data: settings }`. Tests assert `res.body.data.signupEnabled` matches expected value.

### Admin Dashboard

- ✅ **"Platform Settings" in nav bar between Users and Create Admin** — `layout.tsx` navItems: `[Dashboard, Users, Platform Settings, Create Admin]`.
- ✅ **/settings page displays toggle with current value** — `pages/settings/index.tsx` renders a toggle switch with `aria-checked={settings?.signupEnabled}`. `use-settings.ts` fetches from `GET /admin/settings` on mount.
- ✅ **Toggle immediately calls PUT** — `onClick` calls `update({ signupEnabled: !settings?.signupEnabled })` which calls `put("/admin/settings", updates)`.
- ✅ **Success indicator shown** — `{saved && <span className="text-green-400 text-sm">Saved</span>}` displays for 2 seconds after successful update.
- ✅ **Error message on failure** — `{error && <p className="text-red-400 text-sm mb-4">{error}</p>}` renders "Failed to save settings" on catch.

### Server Enforcement

- ✅ **POST /api/auth/signup returns 403 when disabled** — `auth.controller.ts:50` checks `isSignupEnabled()` before processing signup. Test at line 107 confirms 403 with message "Signups are currently closed".
- ✅ **POST /api/auth/google returns 403 for new accounts when disabled** — `auth.controller.ts:440` checks `isSignupEnabled()` only at step 3 (new user creation). Existing users (steps 1–2) bypass the check.
- ✅ **POST /api/auth/google succeeds for existing users regardless** — The toggle check is placed after the existing-provider lookup (step 1) and existing-email lookup (step 2), so existing users always pass through.
- ✅ **POST /api/auth/login unaffected** — `login` function has no `isSignupEnabled` call. Only `signup` (line 50) and `googleAuth` (line 440) reference it.
- ✅ **Password reset unaffected** — `forgotPassword` and `resetPassword` have no `isSignupEnabled` call.
- ✅ **Email verification unaffected** — `verifyEmail` and `resendVerification` have no `isSignupEnabled` call.

### Public Settings Endpoint

- ✅ **GET /api/settings/signup-status is public, returns correct shape** — `settings.controller.ts:getSignupStatus` returns `{ data: { signupEnabled: boolean } }`. Test at line 36 confirms 200 with `signupEnabled: true`. Test at line 55 confirms no API key required.
- ✅ **Mounted before API key middleware** — `app.ts` mounts `settingsRoutes` at `/api/settings` (line 29) before `validateApiKey` (line 34). Order: health → settings → webhooks → API key gate.

### Mobile App (Native + Web)

- ✅ **Checks signup status on launch** — `navigation.tsx` calls `api.getSignupStatus()` in the initial `useEffect` and stores result in `signupEnabled` state. The `getSignupStatus` call in `services/api.ts` uses raw `fetch` (no API key, no auth).
- ✅ **SignupsClosed screen shown when disabled** — When `signupEnabled` is false, the auth stack registers `SignupsClosed` instead of `Signup`. The screen shows 🚧 emoji, "Not Accepting New Accounts" heading, body text, and "Go to Login" button — matching the spec's UI description exactly (`screens/signups-closed/index.tsx`).
- ✅ **Login "Sign up" link navigates to closed screen** — `login/index.tsx:99` navigates to `signupEnabled ? "Signup" : "SignupsClosed"`.
- ✅ **Google button on Signup hidden when disabled** — The Signup screen is entirely replaced by SignupsClosedScreen when disabled (not registered in the navigator), so the Google button is unreachable.
- ✅ **Signup works normally when enabled** — When `signupEnabled` is true, the `Signup` screen is registered normally with full functionality including Google OAuth button.
- ✅ **Checked once on launch, not polled** — The `useEffect` in `navigation.tsx` runs once (dependency array is `[restore, restoreSettings]` — stable refs). No polling or interval.

## Bugs Found

None.

## Summary

- Total criteria: 24
- Passed: 24
- Failed: 0
- Verdict: **PASS**
