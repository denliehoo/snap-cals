# Signup Toggle

## Problem Statement

There is currently no way to prevent new users from signing up. If the platform needs to temporarily close registrations (e.g., during maintenance, capacity limits, or a controlled rollout), the only option is to take down the server or modify code. An admin-controlled toggle allows closing and reopening signups instantly without a redeploy.

## User Stories

1. **As an admin**, I want to toggle signups on or off from the admin dashboard so I can control when new users can register without redeploying the server.

2. **As a potential user**, when signups are disabled, I want to see a clear message explaining that the platform is not accepting new accounts right now, so I understand why I can't sign up.

3. **As an existing user**, I want to continue logging in and using the app normally regardless of whether signups are open or closed.

## Scope

- Global on/off toggle for new account creation (email/password signup AND Google OAuth new-account creation)
- Admin dashboard gets a new "Platform Settings" nav item with the toggle
- Server enforces the setting on signup and OAuth (new accounts only — existing Google OAuth users can still log in)
- Mobile app and web app check the setting and show a "not accepting signups" screen when disabled
- Existing users are completely unaffected — login, all app features, and password reset continue to work

### Out of Scope

- Per-provider signup control (e.g., block email signup but allow Google) — this is a single global toggle
- Invite codes or waitlist functionality
- Scheduled auto-toggle (e.g., "reopen signups at date X")

## Acceptance Criteria

### Admin Database

- [ ] A `PlatformSetting` model exists in the admin Prisma schema with fields: `key` (String, unique), `value` (String), `updatedAt` (DateTime)
- [ ] A seed or migration inserts a default row: `key: "signupEnabled"`, `value: "true"`

### Admin API

- [ ] `GET /api/admin/settings` returns all platform settings as a key-value object (e.g., `{ signupEnabled: true }`)
- [ ] `PUT /api/admin/settings` accepts a partial key-value object and updates matching rows (e.g., `{ signupEnabled: false }`)
- [ ] Both endpoints are protected by the existing `authenticateAdmin` middleware
- [ ] `PUT /api/admin/settings` returns the updated settings object

### Admin Dashboard

- [ ] A "Platform Settings" item appears in the admin nav bar (between "Users" and "Create Admin")
- [ ] The `/settings` page displays a "Signup Enabled" toggle switch with the current value loaded from the API
- [ ] Toggling the switch immediately calls `PUT /api/admin/settings` to persist the change
- [ ] A success indicator (e.g., brief toast or inline "Saved" text) confirms the update
- [ ] An error message is shown if the update fails

### Server Enforcement

- [ ] `POST /api/auth/signup` returns `403 { message: "Signups are currently closed" }` when `signupEnabled` is `false`
- [ ] `POST /api/auth/google` returns `403 { message: "Signups are currently closed" }` when `signupEnabled` is `false` AND the Google account does not match an existing user (i.e., it would create a new account)
- [ ] `POST /api/auth/google` succeeds normally for existing users regardless of the toggle (login, not signup)
- [ ] `POST /api/auth/login` is unaffected by the toggle — existing users can always log in
- [ ] Password reset (`/api/auth/forgot-password`, `/api/auth/reset-password`) is unaffected
- [ ] Email verification (`/api/auth/verify-email`, `/api/auth/resend-verification`) is unaffected — users who signed up before the toggle was disabled can still verify

### Public Settings Endpoint

- [ ] `GET /api/settings/signup-status` is a public endpoint (no auth, no API key) that returns `{ data: { signupEnabled: boolean } }`
- [ ] This endpoint is mounted before the API key middleware in `app.ts` (same pattern as health check)

### Mobile App (Native + Web)

- [ ] On app launch (when unauthenticated), the app calls `GET /api/settings/signup-status` to check if signups are open
- [ ] When signups are disabled, the Signup screen is replaced with a "Not Accepting Signups" screen showing a message like "We're not accepting new accounts at the moment. Please check back later." and a button to go to the Login screen
- [ ] The "Don't have an account? Sign up" link on the Login screen navigates to the same "Not Accepting Signups" screen (or is hidden) when signups are disabled
- [ ] The "Continue with Google" button on the Signup screen is also hidden/disabled when signups are disabled (since new Google accounts would also be rejected)
- [ ] When signups are enabled, the Signup screen works exactly as it does today — no changes
- [ ] The signup status is checked once on app launch (not polled) — if the admin toggles mid-session, the user sees the change on next app restart or navigation to the auth stack

## Data Model Changes

### Admin Database

New model in `prisma/admin/schema.prisma`:

#### `PlatformSetting`

| Field     | Type     | Notes                |
|-----------|----------|----------------------|
| key       | String   | Primary key, unique  |
| value     | String   | Stored as string     |
| updatedAt | DateTime | Auto-updated         |

Seed data: `{ key: "signupEnabled", value: "true" }`

### App Database

No changes.

## API Changes

### New Endpoints

| Endpoint                        | Method | Auth          | Description                                    |
|---------------------------------|--------|---------------|------------------------------------------------|
| `GET /api/settings/signup-status` | GET    | None (public) | Returns `{ data: { signupEnabled: boolean } }` |
| `GET /api/admin/settings`       | GET    | Admin JWT     | Returns all platform settings                  |
| `PUT /api/admin/settings`       | PUT    | Admin JWT     | Updates platform settings                      |

### Modified Endpoints

| Endpoint              | Change                                                                 |
|-----------------------|------------------------------------------------------------------------|
| `POST /api/auth/signup` | Check `signupEnabled` before processing; return 403 if disabled       |
| `POST /api/auth/google` | Check `signupEnabled` before creating a new user; existing users pass |

### Route Mounting Order in `app.ts`

```
health check (public) → signup-status (public) → webhooks (own auth) → API key gate → ...
```

## UI/UX Notes

### Admin Dashboard — Platform Settings Page

- Route: `/settings`
- Simple page with a heading "Platform Settings" and a single toggle row: label "Allow New Signups" with an on/off switch
- The toggle reflects the current server state on page load
- Designed to be extensible — future platform settings (e.g., maintenance mode) can be added as additional rows on the same page

### Mobile App — Signups Closed Screen

- Replaces the Signup screen in the auth stack when signups are disabled
- Centered layout with:
  - An icon or emoji (e.g., 🚧)
  - Heading: "Not Accepting New Accounts"
  - Body: "We're not accepting new sign-ups at the moment. Please check back later."
  - Button: "Go to Login" → navigates to Login screen
- Uses the existing theme system (colors, spacing, fonts from `theme.ts`)
- Same screen on web (no `.web.tsx` override needed — no native modules involved)

### Login Screen Adjustments

- When signups are disabled: the "Don't have an account? Sign up" link either navigates to the closed screen or is hidden entirely
- The Google OAuth button on the Login screen remains visible — it's for existing users logging in, which is always allowed

## Risks & Dependencies

- **Admin DB dependency**: The signup check on the app server reads from the admin database. If the admin DB is unreachable, the server should default to allowing signups (fail-open) to avoid locking out all new users due to a DB outage. This should be a try/catch with a sensible default.
- **Caching**: For the public `/api/settings/signup-status` endpoint, consider a short in-memory cache (e.g., 60 seconds) to avoid hitting the admin DB on every unauthenticated request. This means there's up to a 60-second delay between an admin toggling signups off and the server enforcing it — acceptable for this use case.
- **Google OAuth edge case**: The toggle must distinguish between "Google user logging in" (existing account → always allowed) and "Google user signing up" (new account → blocked when disabled). The current `POST /api/auth/google` handler already checks for existing users before creating — the toggle check should happen at the "about to create" branch.
- **No mobile-side enforcement**: The mobile app hides the signup UI as a UX courtesy, but the real enforcement is server-side. A determined user could still call the API directly — the server must reject it.
