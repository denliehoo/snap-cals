# Phase 7: Auth Enhancements — Implementation Plan

## Problem Statement

The app currently only supports email/password auth with no email verification, no password reset, and no social login. This phase adds a complete auth overhaul: email verification via OTP, password reset via OTP, Google OAuth (designed to be extensible to other providers), and account linking between email and OAuth accounts.

## Requirements

1. Email verification — new email/password signups must verify via a 6-digit OTP code before they can log in. OAuth users (Google) skip verification.
2. Password reset — users request a reset, receive a 6-digit OTP, enter it in-app, then set a new password.
3. Google OAuth — "Continue with Google" button on login/signup screens using `expo-auth-session`. Mobile sends the Google `id_token` to the backend, which verifies it and issues the app's JWT.
4. Account linking — if a user signs up with email then later signs in with Google (same email), the accounts are linked. Vice versa: an OAuth-only user can later set a password.
5. Provider-extensible DB schema — an `AuthProvider` table so adding Facebook/Apple/GitHub later is just a new row, not a schema migration.
6. Email service — Resend for sending OTP emails (verification + password reset).
7. Seeded users should be marked as verified by default.

## Background

Current auth state:
- `User` model has `email` (unique) and `passwordHash` — no verification flag, no provider columns
- Passport.js JWT strategy for protected routes, `bcrypt` for password hashing
- Mobile uses `expo-secure-store` for token persistence, Zustand for auth state
- Login/signup screens are simple email+password forms
- Shared types in `@snap-cals/shared` define `SignupRequest`, `LoginRequest`, `AuthResponse`

Key technology decisions:
- `expo-auth-session` for mobile OAuth (provider-agnostic, works in Expo Go, adding new providers is just configuration not new native dependencies)
- `google-auth-library` (`verifyIdToken`) on the backend to verify Google's `id_token`
- `Resend` npm package for transactional emails (3,000/month free, scales well on paid tiers, modern developer-friendly API)
- OTP codes stored in DB with expiry (10 min), hashed with bcrypt for security

## Proposed Solution

The approach uses a provider-extensible schema with an `AuthProvider` join table rather than adding `google_sub` columns directly to `User`. This means adding Facebook later is just a new `AuthProvider` row — no migration needed.

The OAuth flow for mobile:
1. Mobile uses `expo-auth-session` to open Google's consent screen in a browser
2. Google redirects back with an `id_token`
3. Mobile sends the `id_token` to `POST /api/auth/google`
4. Backend verifies the `id_token` using `google-auth-library`, finds/creates user, handles linking, issues app JWT

DB schema changes: Add `emailVerified Boolean @default(false)` to User, make `passwordHash` optional (`String?`), add `AuthProvider` model with unique constraint on `[provider, providerUserId]`, add `OtpType` enum and `Otp` model with index on `[userId, type]`.

## Task Breakdown

### Task 1: Phase roadmap and implementation plan docs

- [x] Update `docs/phase-roadmap.md`: move Subscription & Usage Limits to Phase 8, insert new auth-focused Phase 7
- [x] Create `docs/phase-7-implementation-plan.md` with this plan
- [x] Update `docs/architecture.md`: add Phase 7 to the phase roadmap list

### Task 2: DB schema migration

- [x] Add `emailVerified Boolean @default(false)` to `User`
- [x] Make `passwordHash` optional (`String?`) to support OAuth-only users
- [x] Add `AuthProvider` model with `id`, `userId`, `provider` (String), `providerUserId` (String), `createdAt`, unique constraint on `[provider, providerUserId]`, index on `userId`
- [x] Add `OtpType` enum (`EMAIL_VERIFICATION`, `PASSWORD_RESET`)
- [x] Add `Otp` model with `id`, `userId`, `codeHash`, `type` (OtpType), `expiresAt`, `used` (default false), `createdAt`, index on `[userId, type]`
- [x] Generate migration with `prisma migrate dev --create-only`
- [x] Update seed script: set `emailVerified: true` for seeded test user
- [x] Update test helper `createTestUser`: set `emailVerified: true` by default
- [x] Update `cleanDb`: delete from `Otp`, `AuthProvider` before `User`
- [x] Update shared types: add `emailVerified` to `User` interface
- [x] Run migration on test DB (`pnpm migrate:test`)
- [x] Verify all existing tests pass

### Task 3: Email service setup with Resend

- [x] Install `resend` package in `apps/server`
- [x] Create `src/services/email.service.ts` with `sendVerificationCode` and `sendPasswordResetCode`
- [x] Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env.example`
- [x] Tests: mock Resend client, verify correct params for both email types, verify error propagation

### Task 4: OTP utility and email verification on signup (backend)

- [x] Create `src/utils/otp.ts` with `generateOtp`, `hashOtp`, `verifyOtp`
- [x] Modify `signup` controller: generate OTP, send email, return `{ userId, emailVerified: false }` (no JWT)
- [x] Add `POST /api/auth/verify-email`: verify OTP, set `emailVerified = true`, return JWT
- [x] Add `POST /api/auth/resend-verification`: invalidate old OTPs, generate new, send email
- [x] Modify `login` controller: return `{ userId, emailVerified: false }` if unverified
- [x] Update shared types: `VerifyEmailRequest`, `ResendVerificationRequest`, auth response types
- [x] Tests: signup flow, verify-email (correct/wrong/expired/used code), resend, login verified/unverified

### Task 5: Password reset flow (backend)

- [x] Add `POST /api/auth/forgot-password`: generate OTP, send email, always return 200
- [x] Add `POST /api/auth/reset-password`: verify OTP, update password
- [x] Update shared types: `ForgotPasswordRequest`, `ResetPasswordRequest`
- [x] Tests: forgot-password (existing/non-existent/OAuth-only), reset (correct/wrong/expired code, short password)

### Task 6: Google OAuth backend endpoint

- [x] Install `google-auth-library` in `apps/server`
- [x] Add `GOOGLE_CLIENT_ID` to `.env.example`
- [x] Create `POST /api/auth/google`: verify `id_token`, account linking logic, return JWT
- [x] Update shared types: `GoogleAuthRequest`
- [x] Tests: new user, existing Google user, account linking, invalid token, unverified Google email

### Task 7: Mobile — email verification screen and updated signup/login flow

- [x] Add `api.verifyEmail` and `api.resendVerification` to API service
- [x] Create `screens/verify-email/index.tsx` with OTP input, submit, resend with cooldown
- [x] Add `VerifyEmail` to auth navigator
- [x] Update `auth.store.ts`: handle verification-needed responses
- [x] Update `use-auth-form.ts`: navigate to verify screen when needed
- [x] Tests: screen renders, submit calls API, resend works, navigation flows

### Task 8: Mobile — password reset flow

- [x] Add `api.forgotPassword` and `api.resetPassword` to API service
- [x] Add "Forgot password?" link to login screen
- [x] Create `screens/forgot-password/index.tsx` and `screens/reset-password/index.tsx`
- [x] Add both screens to auth navigator
- [x] Tests: screen renders, form submission, password mismatch validation, success navigation

### Task 9: Mobile — Google OAuth integration

- [x] Install `expo-auth-session` and `expo-crypto` in `apps/mobile`
- [x] Add `"scheme": "snapcals"` to `app.json`
- [x] Add `api.googleAuth` to API service
- [x] Create `src/hooks/use-google-auth.ts`
- [x] Add "Continue with Google" button to login and signup screens
- [x] Update `auth.store.ts` with `googleLogin` action
- [x] Tests: button renders, auth triggers, success/failure handling

### Task 10: Documentation and end-to-end verification

- [x] Update `README.md`: new env vars, Google Cloud Console setup, pre-verified seed note
- [x] Update `docs/architecture.md`: Auth Flow, API Design, Database, Tech Stack sections
- [x] Update `docs/phase-roadmap.md`: mark Phase 7 as completed
- [x] Remove Google OAuth from Product Backlog
- [x] End-to-end verification of all auth flows
