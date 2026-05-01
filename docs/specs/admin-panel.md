# Admin Panel

## Problem Statement

As Snap Cals grows, the developer (and eventually other team members) needs a way to view and manage user data without querying the database directly. Currently, inspecting a user's food entries, goals, or weight history requires running Prisma Studio or raw SQL against Neon. An admin web dashboard provides a structured, secure interface for viewing user progress and making corrections when needed.

## User Stories

1. **As an admin**, I want to log in to a web dashboard with my admin credentials so that only authorized people can access user data.

2. **As an admin**, I want to see a list of all app users (with search by email) so I can quickly find a specific user.

3. **As an admin**, I want to view a user's daily food entries grouped by meal type with macro totals and goal progress, so I can see exactly what they see in the app.

4. **As an admin**, I want to view a user's weekly summary (7-day daily totals), so I can assess their tracking consistency.

5. **As an admin**, I want to view a user's weight history (chart + entry list with time range filters), so I can see their progress over time.

6. **As an admin**, I want to view and edit a user's nutrition goals, so I can correct them if a user requests help.

7. **As an admin**, I want to edit a user's food entries (name, calories, macros, serving size, source, meal type, date), so I can fix incorrect data on their behalf.

8. **As an admin**, I want to create additional admin accounts from the dashboard, so I can grant access to team members in the future.

## Acceptance Criteria

### Infrastructure

- [ ] A new `apps/admin` package exists in the monorepo (React + Vite + TypeScript)
- [ ] The admin app imports shared types from `@snap-cals/shared`
- [ ] A separate Neon database exists for admin data
- [ ] A second Prisma schema (`prisma/admin-schema.prisma` or similar) defines the admin data model and generates a separate Prisma client
- [ ] The Express server connects to both databases (app DB for user data, admin DB for admin auth)
- [ ] A seed script creates the first admin account (email + bcrypt-hashed password)

### Admin Auth

- [ ] `POST /api/admin/auth/login` accepts email + password, validates against the admin DB, and returns a JWT on success
- [ ] The admin JWT is signed with a separate secret (`ADMIN_JWT_SECRET`) from the app JWT
- [ ] All `/api/admin/*` routes (except `/api/admin/auth/login`) require a valid admin JWT via a dedicated admin auth middleware
- [ ] Invalid or missing admin JWT returns 401
- [ ] The admin login page is at `/login` in the Vite app
- [ ] Successful login stores the JWT (localStorage or sessionStorage) and redirects to `/dashboard`
- [ ] A logout action clears the stored JWT and redirects to `/login`
- [ ] Unauthenticated access to any page redirects to `/login`
- [ ] No password reset flow in v1 — admin passwords are set via the seed script or by another admin

### Admin Management

- [ ] `GET /api/admin/admins` returns a list of all admin accounts (id, email, name, createdAt)
- [ ] `POST /api/admin/admins` creates a new admin account (email, name, password) — returns 409 if email already exists
- [ ] A "Create Admin" page is accessible from the dashboard navigation
- [ ] The create admin form validates: email format, password minimum length, required name
- [ ] Newly created admins can log in immediately

### User List

- [ ] `GET /api/admin/users` returns a paginated list of app users with: id, email, subscriptionTier, createdAt, emailVerified
- [ ] The endpoint supports `?search=` query param for filtering by email (case-insensitive partial match)
- [ ] The endpoint supports `?page=` and `?limit=` for pagination (default: page 1, limit 20)
- [ ] The response includes total count for pagination UI
- [ ] The Users page (`/users`) displays the user list in a table with columns: email, tier, signup date, verified status
- [ ] A search input filters users by email (debounced, triggers API call)
- [ ] Clicking a user row navigates to `/users/:id`

### User Detail — Daily View

- [ ] `GET /api/admin/users/:id/entries?date=` returns the user's food entries for a given date
- [ ] `GET /api/admin/users/:id/goals` returns the user's current goals (or null if not set)
- [ ] The user detail page (`/users/:id`) has a "Daily" tab showing entries grouped by meal type
- [ ] Each entry displays: name, source (if present), serving size, calories, protein, carbs, fat
- [ ] Daily macro totals are shown with progress against goals (if goals exist)
- [ ] A date navigator (previous/next day) allows browsing different dates
- [ ] The date defaults to today

### User Detail — Weekly View

- [ ] `GET /api/admin/users/:id/entries/week?startDate=` returns the user's entries for a 7-day period
- [ ] The user detail page has a "Weekly" tab showing a 7-day summary
- [ ] Each day shows: date, total calories, protein, carbs, fat, entry count
- [ ] A week navigator (previous/next week) allows browsing different weeks
- [ ] Days with no entries show zeroes

### User Detail — Weight History

- [ ] `GET /api/admin/users/:id/weight` returns the user's weight entries ordered by `loggedAt` desc
- [ ] The endpoint supports `?from=` query param for time range filtering
- [ ] The user detail page has a "Weight" tab showing a line chart and entry list
- [ ] Time range filter buttons: 7d, 30d, 90d, All
- [ ] Each weight entry displays: date/time, weight (both kg and lbs), note (if present)

### User Detail — Edit Goals

- [ ] `PUT /api/admin/users/:id/goals` updates the user's goals (dailyCalories, dailyProtein, dailyCarbs, dailyFat)
- [ ] If the user has no goals, this endpoint creates them (upsert behavior)
- [ ] The Goals section on the user detail page shows current values with an "Edit" button
- [ ] The edit form validates: all values must be non-negative numbers
- [ ] Successful save shows a success message

### User Detail — Edit Entry

- [ ] `PUT /api/admin/users/:id/entries/:entryId` updates a food entry's fields
- [ ] The endpoint validates ownership (entry belongs to the specified user)
- [ ] Clicking an entry row on the daily view opens an edit form/modal
- [ ] Editable fields: name, calories, protein, carbs, fat, servingSize, source, mealType, date
- [ ] Validation matches the existing app rules (name required, calories required, valid meal type, field length limits)
- [ ] Successful save refreshes the daily view

### Dashboard

- [ ] The `/dashboard` page shows a "Dashboard coming soon" placeholder message
- [ ] The page is accessible after login and is the default landing page

### Responsive Design

- [ ] All pages are usable on desktop (1024px+) and mobile web (375px+)
- [ ] Tables collapse to card layouts on small screens
- [ ] Navigation works on both desktop (sidebar or top nav) and mobile (hamburger menu or bottom nav)

## Data Model Changes

### New Database (Admin DB)

#### `Admin` model

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | Primary key |
| email | String | Unique |
| name | String | Display name |
| passwordHash | String | bcrypt |
| createdAt | DateTime | Default now |

### App Database

No changes to the existing app schema.

## API Changes

### New Endpoints

All under `/api/admin/*`, protected by admin JWT middleware (except login).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/auth/login` | POST | Admin login (email + password → JWT) |
| `/api/admin/admins` | GET | List all admins |
| `/api/admin/admins` | POST | Create a new admin |
| `/api/admin/users` | GET | List app users (paginated, searchable) |
| `/api/admin/users/:id` | GET | Get single user profile |
| `/api/admin/users/:id/entries` | GET | Get user's entries by date |
| `/api/admin/users/:id/entries/week` | GET | Get user's entries for a week |
| `/api/admin/users/:id/entries/:entryId` | PUT | Edit a user's food entry |
| `/api/admin/users/:id/goals` | GET | Get user's goals |
| `/api/admin/users/:id/goals` | PUT | Update/create user's goals |
| `/api/admin/users/:id/weight` | GET | Get user's weight entries |

### Existing Endpoints

No changes to existing app API endpoints.

### API Security

- Admin routes use a separate Passport JWT strategy (`admin-jwt`) with `ADMIN_JWT_SECRET`
- Admin routes are mounted behind the existing API key middleware (same `X-Api-Key` header)
- Rate limiting on `/api/admin/auth/*`: same pattern as app auth routes (20 req / 15 min)
- Admin JWT payload includes `sub` (admin id) and `role: "admin"` to distinguish from app JWTs

## UI/UX Notes

### Pages & Navigation

| Route | Page | Notes |
|-------|------|-------|
| `/login` | Login | Email + password form, redirects to `/dashboard` on success |
| `/dashboard` | Dashboard | "Coming soon" placeholder for v1 |
| `/users` | User List | Table with search, pagination, click to detail |
| `/users/:id` | User Detail | Tabbed view: Daily, Weekly, Weight, Goals |
| `/admins/new` | Create Admin | Form: email, name, password |

### Design

- Responsive-first using a utility CSS framework (e.g., Tailwind CSS)
- Clean, minimal admin aesthetic — no need to match the mobile app's design system
- Tables for data-dense views on desktop, card layouts on mobile web
- Date/week navigation mirrors the mobile app's pattern (left/right arrows + date label)
- Entry edit via modal overlay (not a separate page)
- Weight chart uses a lightweight web charting library (e.g., Recharts)

### State Management

- Lightweight — React state + context for auth, no need for Zustand on the web side
- API calls via fetch or a thin wrapper, JWT attached via header

## Risks & Dependencies

- **Dual Prisma client**: The server will import two generated Prisma clients (app + admin). This is a supported Prisma pattern but adds build/migration complexity. Each schema has its own `prisma migrate` workflow. Documentation should clearly distinguish the two.
- **Neon free tier limits**: A second Neon database uses a second free-tier project. Neon allows multiple free projects, but verify current limits before provisioning.
- **Admin JWT secret management**: A second JWT secret (`ADMIN_JWT_SECRET`) must be added to server environment variables. If it's the same as the app secret, an app user's JWT could pass admin middleware — they must be different.
- **No admin password reset**: If an admin forgets their password in v1, the only recovery is re-running the seed script or having another admin create a new account. Acceptable for a small team but should be addressed if the admin count grows.
- **CORS**: The admin Vite app will run on a different port (dev) or domain (prod) than the Express server. CORS configuration in `app.ts` needs to allow the admin origin.
- **No delete operations**: v1 intentionally excludes deleting users or entries from the admin panel. This can be added later if needed.
- **Shared types**: The admin frontend imports from `@snap-cals/shared` for existing types (FoodEntry, Goal, WeightEntry, MealType, etc.). New admin-specific request/response types should also live in shared.
