# User Status

## Problem Statement

The app currently uses a boolean `emailVerified` field on the `User` model to track whether a user has verified their email. This is insufficient for account moderation — there is no way for an admin to deactivate a user's account and prevent them from using the app. Admins need the ability to control user access beyond just email verification state.

## User Stories

1. **As an admin**, I want to deactivate a user's account so they are immediately locked out and cannot use the app until I reactivate them.
2. **As an admin**, I want to set a user's status to unverified so they must re-verify their email before using the app again.
3. **As an admin**, I want to reactivate a deactivated user so they can log in and use the app normally again.
4. **As a deactivated user**, I want to see a clear error message telling me to contact the admin when I try to log in, so I understand why I can't access my account.
5. **As a deactivated user**, I want to be kicked out of the app immediately if I'm currently logged in, so the deactivation takes effect without waiting for my JWT to expire.

## Data Model Changes

### Replace `emailVerified` with `status` enum

Remove the `emailVerified: Boolean` field from the `User` model and replace it with a `status` enum field.

**New Prisma enum:**

```
enum UserStatus {
  VERIFIED
  UNVERIFIED
  DEACTIVATED
}
```

**User model change:**

- Remove: `emailVerified Boolean @default(false)`
- Add: `status UserStatus @default(UNVERIFIED)`

**Migration strategy:**

- Create a migration that adds the `UserStatus` enum and `status` column
- Migrate existing data: `emailVerified = true` → `VERIFIED`, `emailVerified = false` → `UNVERIFIED`
- Drop the `emailVerified` column

### Shared types

**New enum in `packages/shared/src/enums.ts`:**

```
enum UserStatus {
  VERIFIED = "VERIFIED",
  UNVERIFIED = "UNVERIFIED",
  DEACTIVATED = "DEACTIVATED",
}
```

**Update `User` interface in `packages/shared/src/models.ts`:**

- Remove: `emailVerified: boolean`
- Add: `status: UserStatus`

**Update `AdminUserSummary` in `packages/shared/src/admin.ts`:**

- Remove: `emailVerified: boolean`
- Add: `status: UserStatus`

**Update `AuthPendingResponse` in `packages/shared/src/auth.ts`:**

- Remove: `emailVerified: false`
- Add: `status: "UNVERIFIED"`

**New type in `packages/shared/src/admin.ts`:**

```
interface AdminUpdateUserStatusRequest {
  status: UserStatus;
}
```

## API Changes

### Modified endpoints

**`POST /api/auth/login`**

- Current: returns `{ userId, emailVerified: false }` for unverified users
- New: returns `{ userId, status: "UNVERIFIED" }` for unverified users
- New: returns `{ message: "Your account has been deactivated. Please contact the admin." }` with **403** status for deactivated users
- No change for verified users (still returns JWT + user)

**`POST /api/auth/google`**

- Existing user with `DEACTIVATED` status attempting to log in via Google OAuth: return **403** with the same deactivation message (applies to both linked Google accounts and email-match linking)
- New Google account creation: unaffected (new users are created with `VERIFIED` status)

**`POST /api/auth/signup`**

- New users are created with `UNVERIFIED` status (same behavior as current `emailVerified: false`)

**`POST /api/auth/verify-email`**

- Sets `status` to `VERIFIED` instead of `emailVerified: true`

**Passport JWT middleware (`middleware/passport.ts`)**

- After finding the user, check `status`:
  - `DEACTIVATED` → return `done(null, false)` (triggers 401 → app clears token → login screen)
  - `UNVERIFIED` → return `done(null, false)` (same — they shouldn't have a JWT, but safety net)
  - `VERIFIED` → proceed as normal

**All endpoints returning user data** (`userResponse` helper in `auth.controller.ts`):

- Replace `emailVerified` with `status` in the response shape

**Admin `GET /api/admin/users`** and **`GET /api/admin/users/:id`**:

- Return `status` instead of `emailVerified`

### New endpoint

**`PATCH /api/admin/users/:id/status`**

- Auth: admin JWT required (`authenticateAdmin` middleware)
- Request body: `{ status: "VERIFIED" | "UNVERIFIED" | "DEACTIVATED" }`
- Validates that `status` is one of the three valid values
- Updates the user's `status` field
- Returns the updated user object
- 404 if user not found
- 400 if invalid status value

## UI/UX Notes

### Admin panel — User list (`apps/admin`)

- Replace the "Verified" column (currently shows ✓/✗) with a "Status" column
- Display status as a colored badge:
  - `VERIFIED` → green badge
  - `UNVERIFIED` → yellow/amber badge
  - `DEACTIVATED` → red badge
- Same badge treatment on the mobile card layout

### Admin panel — User detail page

- Add a "Status" tab alongside the existing tabs (daily, weekly, weight, goals)
- The Status tab displays:
  - Current status as a badge
  - A dropdown/select to change the status (options: Verified, Unverified, Deactivated)
  - A "Save" button to apply the change
- When selecting "Deactivated," show a confirmation dialog: **"This will immediately lock the user out of the app. Are you sure?"**
- Success/error feedback via toast (existing toast system)

### Mobile app

- The login screen error handling needs to handle the new 403 status for deactivated users and display the "contact admin" message
- The `AuthPendingResponse` type changes from `emailVerified: false` to `status: "UNVERIFIED"` — the verify-email redirect logic should check for `status === "UNVERIFIED"` instead of `emailVerified === false`
- No other mobile UI changes — the deactivation lockout is handled automatically by the existing 401 → logout flow

### Web (PWA)

- Same login error handling changes as mobile (shared codebase)

## Acceptance Criteria

### Data model

1. The `User` table has a `status` column of type `UserStatus` enum with values `VERIFIED`, `UNVERIFIED`, `DEACTIVATED`
2. The `emailVerified` column no longer exists on the `User` table
3. Existing users with `emailVerified = true` have `status = VERIFIED` after migration
4. Existing users with `emailVerified = false` have `status = UNVERIFIED` after migration
5. New users created via email signup have `status = UNVERIFIED`
6. New users created via Google OAuth have `status = VERIFIED`

### Login — email/password

7. A `VERIFIED` user can log in and receives a JWT (existing behavior)
8. An `UNVERIFIED` user who logs in receives `{ userId, status: "UNVERIFIED" }` with 200 status and is redirected to the email verification screen
9. A `DEACTIVATED` user who logs in receives a 403 with message "Your account has been deactivated. Please contact the admin."
10. The mobile/web app displays the deactivation error message on the login screen (not a generic error)

### Login — Google OAuth

11. A `DEACTIVATED` user with a linked Google account who logs in via Google receives a 403 with the deactivation message
12. A `DEACTIVATED` user whose email matches a Google account (account linking path) receives a 403 with the deactivation message
13. A new Google user (no existing account) is created with `VERIFIED` status and logs in normally

### Immediate lockout

14. A currently logged-in user whose status is changed to `DEACTIVATED` by an admin receives a 401 on their next API call
15. The mobile/web app clears the stored token and redirects to the login screen upon receiving the 401
16. The deactivated user then sees the 403 "contact admin" message when they attempt to log in again

### Email verification

17. `POST /api/auth/verify-email` sets the user's status to `VERIFIED` (not `emailVerified: true`)
18. The verify-email screen still works correctly for `UNVERIFIED` users

### Admin — status management

19. `PATCH /api/admin/users/:id/status` with `{ status: "DEACTIVATED" }` sets the user's status to `DEACTIVATED`
20. `PATCH /api/admin/users/:id/status` with `{ status: "VERIFIED" }` sets the user's status to `VERIFIED`
21. `PATCH /api/admin/users/:id/status` with `{ status: "UNVERIFIED" }` sets the user's status to `UNVERIFIED`
22. The endpoint returns 404 for a non-existent user ID
23. The endpoint returns 400 for an invalid status value
24. The endpoint requires admin authentication (returns 401 without a valid admin JWT)

### Admin — user list

25. The user list table shows a "Status" column with colored badges instead of the "Verified" ✓/✗ column
26. The mobile card layout shows the status badge instead of "Verified"/"Unverified" text

### Admin — user detail

27. The user detail page has a "Status" tab
28. The Status tab shows the user's current status as a badge
29. The Status tab has a dropdown to select a new status and a Save button
30. Selecting "Deactivated" and clicking Save shows a confirmation dialog before applying
31. After confirming, the status is updated and a success toast is shown
32. Cancelling the confirmation dialog does not change the status

### Reactivation

33. An admin sets a deactivated user's status to `VERIFIED` → the user can log in normally on their next attempt
34. An admin sets a deactivated user's status to `UNVERIFIED` → the user is redirected to the email verification screen on their next login attempt

## Risks & Dependencies

- **Breaking change to shared types**: `emailVerified` is replaced by `status` across `User`, `AdminUserSummary`, and `AuthPendingResponse`. All consumers (mobile app, web app, admin panel, server) must be updated together. Deploy server first, then clients.
- **Migration on production data**: The migration converts existing boolean data to an enum. Should be tested against a copy of production data before deploying. Use `prisma migrate dev --create-only` per project convention.
- **Test database**: After creating the migration, run `pnpm migrate:test` in `apps/server` to apply it to the test branch.
- **Existing tests**: Auth tests reference `emailVerified` — they will need updating to use `status`.
- **No audit log**: There is no record of who changed a user's status or when. This is acceptable for v1 but may be needed later if status changes become contentious.
