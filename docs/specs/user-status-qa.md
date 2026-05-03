## QA Report: User Status

### Date: 2026-05-02

### Spec: docs/specs/user-status.md

### Results

#### Data model

1. ✅ PASS — The `User` table has a `status` column of type `UserStatus` enum with values `VERIFIED`, `UNVERIFIED`, `DEACTIVATED`
   Evidence: `apps/server/prisma/schema.prisma` — `status UserStatus @default(UNVERIFIED)` on User model, enum defined with all three values.

2. ✅ PASS — The `emailVerified` column no longer exists on the `User` table
   Evidence: `apps/server/prisma/schema.prisma` — no `emailVerified` field. Migration `20260502072634_add_user_status/migration.sql` drops the column.

3. ✅ PASS — Existing users with `emailVerified = true` have `status = VERIFIED` after migration
   Evidence: Migration SQL: `UPDATE "User" SET "status" = 'VERIFIED' WHERE "emailVerified" = true;`

4. ✅ PASS — Existing users with `emailVerified = false` have `status = UNVERIFIED` after migration
   Evidence: Migration SQL: `UPDATE "User" SET "status" = 'UNVERIFIED' WHERE "emailVerified" = false;`

5. ✅ PASS — New users created via email signup have `status = UNVERIFIED`
   Evidence: `auth.controller.ts:signup` — `prisma.user.create({ data: { email, passwordHash } })` uses Prisma default `UNVERIFIED`. Test "creates a user and returns userId with status UNVERIFIED" passes.

6. ✅ PASS — New users created via Google OAuth have `status = VERIFIED`
   Evidence: `auth.controller.ts:googleAuth` — `prisma.user.create({ data: { email, status: "VERIFIED", ... } })`. Test "creates a new user for first-time Google login" asserts `status === "VERIFIED"`.

#### Login — email/password

7. ✅ PASS — A `VERIFIED` user can log in and receives a JWT
   Evidence: `auth.controller.ts:login` — verified users get `signToken(user.id)`. Test "returns a token for verified user" passes.

8. ✅ PASS — An `UNVERIFIED` user who logs in receives `{ userId, status: "UNVERIFIED" }` with 200 status
   Evidence: `auth.controller.ts:login` lines checking `user.status === "UNVERIFIED"` → returns `{ data: { userId: user.id, status: "UNVERIFIED" } }`. Test "returns userId and status UNVERIFIED for unverified user" passes.

9. ✅ PASS — A `DEACTIVATED` user who logs in receives a 403 with deactivation message
   Evidence: `auth.controller.ts:login` — `user.status === "DEACTIVATED"` → `res.status(403).json({ message: DEACTIVATED_MSG })`. Test "returns 403 for deactivated user on email/password login" passes.

10. ✅ PASS — The mobile/web app displays the deactivation error message on the login screen
    Evidence: `api.ts:request` throws `{ status: 403, message: "..." }` on non-OK responses. `getErrorMessage` in `utils/error.ts` extracts the `message` field. `useAuthForm` catches and calls `onError(getErrorMessage(e, ...))` → snackbar displays the message. Login screen test "shows error on login failure" confirms error messages are displayed via snackbar.

#### Login — Google OAuth

11. ✅ PASS — A `DEACTIVATED` user with a linked Google account receives a 403
    Evidence: `auth.controller.ts:googleAuth` — `existingProvider.user.status === "DEACTIVATED"` → 403. Test "returns 403 for deactivated user with linked Google account" passes.

12. ✅ PASS — A `DEACTIVATED` user via email-match linking receives a 403
    Evidence: `auth.controller.ts:googleAuth` — `existingUser.status === "DEACTIVATED"` → 403. Test "returns 403 for deactivated user via email-match linking" passes.

13. ✅ PASS — A new Google user is created with `VERIFIED` status and logs in normally
    Evidence: `auth.controller.ts:googleAuth` — `status: "VERIFIED"` in create. Test "creates a new user for first-time Google login" passes with `status === "VERIFIED"`.

#### Immediate lockout

14. ✅ PASS — A currently logged-in user whose status is changed to `DEACTIVATED` receives a 401 on their next API call
    Evidence: `middleware/passport.ts` — `if (!user || user.status !== "VERIFIED") return done(null, false)` — any non-VERIFIED user (including DEACTIVATED) is rejected, triggering 401.

15. ✅ PASS — The mobile/web app clears the stored token and redirects to login upon receiving 401
    Evidence: `api.ts:request` — `if (res.status === 401 && onUnauthorized) onUnauthorized()`. `auth.store.ts:restore` sets `onUnauthorized` to `get().logout()`, which clears token/user from storage and state. Navigation switches to auth stack when token is null.

16. ✅ PASS — The deactivated user sees the 403 "contact admin" message when they attempt to log in again
    Evidence: Follows from criteria 9 and 10 — login returns 403 with deactivation message, displayed via snackbar.

#### Email verification

17. ✅ PASS — `POST /api/auth/verify-email` sets the user's status to `VERIFIED`
    Evidence: `auth.controller.ts:verifyEmail` — `prisma.user.update({ where: { id: userId }, data: { status: "VERIFIED" } })`. Test "verifies email with correct code and returns JWT" asserts `user.status === "VERIFIED"`.

18. ✅ PASS — The verify-email screen still works correctly for `UNVERIFIED` users
    Evidence: `auth.controller.ts:verifyEmail` — no status check before verification (any user with a valid OTP can verify). `resendVerification` checks `user.status !== "UNVERIFIED"` to reject already-verified users. Tests pass.

#### Admin — status management

19. ✅ PASS — `PATCH /api/admin/users/:id/status` with `{ status: "DEACTIVATED" }` sets status to `DEACTIVATED`
    Evidence: `admin-users.controller.ts:updateUserStatus` — validates and updates status. Test "updates user status to DEACTIVATED" passes.

20. ✅ PASS — `PATCH /api/admin/users/:id/status` with `{ status: "VERIFIED" }` sets status to `VERIFIED`
    Evidence: Test "updates user status to VERIFIED" passes.

21. ✅ PASS — `PATCH /api/admin/users/:id/status` with `{ status: "UNVERIFIED" }` sets status to `UNVERIFIED`
    Evidence: Test "updates user status to UNVERIFIED" passes.

22. ✅ PASS — The endpoint returns 404 for a non-existent user ID
    Evidence: `admin-users.controller.ts:updateUserStatus` — checks `if (!user)` → 404. Test "returns 404 for non-existent user" passes.

23. ✅ PASS — The endpoint returns 400 for an invalid status value
    Evidence: `admin-users.controller.ts:updateUserStatus` — validates against `PrismaUserStatus` enum. Test "returns 400 for invalid status" passes.

24. ✅ PASS — The endpoint requires admin authentication
    Evidence: `admin.routes.ts` — `router.use(authenticateAdmin)` is applied before the status route. All admin routes after the login route require admin JWT.

#### Admin — user list

25. ✅ PASS — The user list table shows a "Status" column with colored badges
    Evidence: `apps/admin/src/pages/users/user-list.tsx` — `UserTable` has a "Status" `<th>` and renders `<StatusBadge status={user.status} />` with green/yellow/red styles for VERIFIED/UNVERIFIED/DEACTIVATED.

26. ✅ PASS — The mobile card layout shows the status badge
    Evidence: `apps/admin/src/pages/users/user-list.tsx` — `UserCardList` renders `<StatusBadge status={user.status} />` in each card.

#### Admin — user detail

27. ✅ PASS — The user detail page has a "Status" tab
    Evidence: `apps/admin/src/pages/user-detail/index.tsx` — tab list includes `"status"`, renders `<StatusTab userId={id} />`.

28. ✅ PASS — The Status tab shows the user's current status as a badge
    Evidence: `apps/admin/src/pages/user-detail/status-tab.tsx` — "Current status:" label with a styled `<span>` using `badgeStyles[current]`.

29. ✅ PASS — The Status tab has a dropdown to select a new status and a Save button
    Evidence: `status-tab.tsx` — `<select>` with VERIFIED/UNVERIFIED/DEACTIVATED options, `<button>` labeled "Save".

30. ✅ PASS — Selecting "Deactivated" and clicking Save shows a confirmation dialog
    Evidence: `status-tab.tsx:handleSave` — `if (value === "DEACTIVATED") { setConfirmOpen(true); }`. `ConfirmModal` rendered with message "This will immediately lock the user out of the app. Are you sure?"

31. ✅ PASS — After confirming, the status is updated and a success toast is shown
    Evidence: `status-tab.tsx` — `onConfirm={() => mutation.mutate(value)}`, mutation `onSuccess` calls `show("Status updated")` and invalidates queries.

32. ✅ PASS — Cancelling the confirmation dialog does not change the status
    Evidence: `status-tab.tsx` — `onCancel={() => setConfirmOpen(false)}` only closes the modal, does not call `mutation.mutate`.

#### Reactivation

33. ✅ PASS — Admin sets deactivated user to `VERIFIED` → user can log in normally
    Evidence: `auth.controller.ts:login` — only checks for DEACTIVATED and UNVERIFIED; VERIFIED users get a JWT. `passport.ts` allows `status === "VERIFIED"`. Test "updates user status to VERIFIED" confirms the status change works.

34. ✅ PASS — Admin sets deactivated user to `UNVERIFIED` → user is redirected to email verification
    Evidence: `auth.controller.ts:login` — `user.status === "UNVERIFIED"` returns `{ userId, status: "UNVERIFIED" }`, which the mobile app handles by navigating to VerifyEmail screen.

### Bugs Found

1. **Seed script uses removed `emailVerified` field** — `apps/server/prisma/seed.ts:15` still has `emailVerified: true` instead of `status: "VERIFIED"`. Running `pnpm seed` would fail with a Prisma error since the column no longer exists.

### Summary

- Total criteria: 34
- Passed: 34
- Failed: 0
- Bugs found: 1 (non-blocking — seed script, not a spec criterion)
- Verdict: **PASS**
