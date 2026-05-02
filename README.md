# Snap Cals

A mobile calorie and macro tracking app built with React Native and a custom Node.js backend. Users can log food entries, set daily nutrition goals, and view daily/weekly intake summaries.

This project was built as an experiment with agentic AI using [Kiro CLI](https://kiro.dev). AI skills in `.kiro/skills/` guide code generation conventions, and `docs/` contains the architecture decisions and specs that the AI follows across sessions.

## AI-Assisted Development Approach

This project is built collaboratively with [Kiro CLI](https://kiro.dev), an agentic AI coding assistant. The development workflow uses three specialized agents that mirror a small engineering team:

- **PM agent** — takes a feature idea and produces a spec with acceptance criteria (writes to `docs/specs/`)
- **Builder agent** — builds the feature full-stack, following conventions from `.kiro/skills/`
- **QA agent** — reviews the implementation against the spec, writes a QA report with pass/fail per criterion

I'm the orchestrator: I pick what to build from the product backlog (`docs/roadmap.md`), drive each phase, and review the output. The agents do the heavy lifting within each phase, but I decide when a spec is good enough, when to move to build, and when to ship.

The full workflow is documented in [`docs/dev-workflow.md`](./docs/dev-workflow.md).

### How conventions evolve

The agents follow conventions defined in `.kiro/skills/`. When I spot opportunities to refactor or establish coding standards, I ask Kiro to make those changes and document them as skills. This creates a feedback loop: the AI writes code, I shape the standards, and those standards feed back into how the AI writes the next piece of code.

### Key files

- `.kiro/skills/` — YAML-frontmatter skill files that guide code generation (naming conventions, commit format, design system, etc.)
- `.kiro/agents/` — agent configurations (PM, QA) with focused prompts and restricted permissions
- `docs/dev-workflow.md` — step-by-step guide for the plan → build → QA workflow
- `docs/architecture.md` — architectural decisions and patterns
- `docs/roadmap.md` — product backlog
- `docs/specs/` — per-feature specs and QA reports

### Specs vs implementation plans

Earlier phases of this project used detailed implementation plans (`docs/phase-X-implementation-plan.md`) that prescribed step-by-step build instructions. The current workflow replaces these with specs that define *what* to build and *how to verify it*, without dictating the implementation path. The PM agent writes the "what" (spec + acceptance criteria), the builder agent figures out the "how", and the QA agent verifies against the "what." The old implementation plans remain as historical records.

## Tech Stack

| Layer            | Tech                             |
| ---------------- | -------------------------------- |
| Frontend         | React Native + Expo + TypeScript |
| Backend          | Node.js + Express + TypeScript   |
| Database         | Postgres + Prisma ORM            |
| Auth             | Passport.js + JWT                |
| State Management | Zustand                          |
| Navigation       | React Navigation                 |
| Monorepo         | pnpm workspaces                  |

## Project Structure

```
snap-cals/
├── apps/
│   ├── mobile/          # React Native + Expo app
│   ├── admin/           # React + Vite admin dashboard
│   └── server/          # Express API
├── packages/
│   └── shared/          # Shared TypeScript types and enums
├── docs/                # Architecture, roadmap, specs, and QA reports
├── .kiro/
│   ├── skills/          # Conventions that guide code generation
│   └── agents/          # PM and QA agent configurations
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Expo Go](https://expo.dev/go) app on your phone (for mobile testing), or iOS Simulator / Android Emulator

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up the backend

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env` with your database connection string and a JWT secret:

```
DATABASE_URL="your-neon-postgres-connection-string"
JWT_SECRET="pick-a-strong-secret"
PORT=3000
GEMINI_API_KEY="your-gemini-api-key"
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="Snap Cals <noreply@yourdomain.com>"
GOOGLE_IOS_CLIENT_ID="your-ios-client-id.apps.googleusercontent.com"
GOOGLE_ANDROID_CLIENT_ID="your-android-client-id.apps.googleusercontent.com"
```

Generate an API key (used by the mobile app to authenticate requests):

```bash
openssl rand -base64 32
```

Add it to `apps/server/.env`:

```
API_KEY="your-generated-key"
```

Get a free Postgres database at [neon.tech](https://neon.tech) — copy the connection string from the Neon dashboard.

Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Required for AI food estimation features.

Get a free Resend API key at [resend.com](https://resend.com) — required for email verification and password reset. For `EMAIL_FROM`, you can use `Snap Cals <onboarding@resend.dev>` immediately for testing (sends only to your Resend account email). To send to any address, add a custom domain in the Resend dashboard, configure the DNS records (TXT for SPF, CNAME for DKIM), and verify it. Then use `Snap Cals <noreply@yourdomain.com>`.

Set up Google OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) — required for Google sign-in:

1. Create a project (or select existing)
2. If prompted, configure the **OAuth consent screen** first (External, fill in app name and email)
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Create an **iOS** client with Bundle ID `host.exp.Exponent` (for Expo Go dev) or your app's bundle ID (for production)
5. Create an **Android** client with package name `host.exp.exponent` and SHA-1 `B5:E7:CF:2F:C1:C0:6B:6D:2E:7B:88:E2:8D:97:D2:3C:2C:AB:40:4E` (Expo Go). For production, use your app's package name and signing certificate SHA-1
6. You don't need the client secret for either

**Note:** While your OAuth consent screen is in **Testing** mode (the default), only accounts listed as test users can sign in. Add test users under **APIs & Services → OAuth consent screen → Test users** (up to 100). To allow any Google account, publish the app to Production mode (requires Google review).

**Note:** Google OAuth requires a production build (`eas build`) to work on devices. It cannot be tested in Expo Go due to redirect URI limitations.

Set up the mobile environment:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env`:

```
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID="your-ios-client-id.apps.googleusercontent.com"
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID="your-android-client-id.apps.googleusercontent.com"
EXPO_PUBLIC_RC_IOS_API_KEY="your-revenuecat-ios-api-key"
EXPO_PUBLIC_RC_ANDROID_API_KEY="your-revenuecat-android-api-key"
EXPO_PUBLIC_API_KEY="must-match-API_KEY-in-server-env"
```

Optional — only needed for testing on a physical device (Android app or mobile web). Find your Mac's local IP with `ipconfig getifaddr en0`:

```
EXPO_PUBLIC_LOCAL_IP="192.168.x.x"
```

### 3. Run database migrations and seed

```bash
cd apps/server
npx prisma migrate deploy
npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

This applies all migrations to your database and seeds it with a test account (pre-verified):

- Email: `test@example.com`
- Password: `password123`

To explore the database visually:

```bash
npx prisma studio
```

### 4. Schema changes (for contributors)

When you change `prisma/schema.prisma`, generate a migration and apply it:

```bash
cd apps/server
npx prisma migrate dev --create-only --name describe-your-change
# Review the generated SQL in prisma/migrations/
npx prisma migrate deploy
pnpm migrate:test
```

**Important:** Never run `prisma migrate dev` without `--create-only` — it can wipe your database if it detects drift.

### 5. Run the backend

```bash
pnpm dev:server
```

The API will be available at `http://localhost:3000`. Test it with:

```bash
curl http://localhost:3000/api/health
```

### 6. Run the mobile app

In a separate terminal:

```bash
pnpm dev:mobile
```

This starts the Expo dev server. Then either:

- Scan the QR code with Expo Go on your phone
- Press `i` for iOS Simulator
- Press `a` for Android Emulator

### 6b. Run the web version

```bash
pnpm dev:mw
```

Opens the app in your browser at `http://localhost:8088`. The web version uses the same codebase as the mobile app with `.web.ts` / `.web.tsx` overrides for native-only modules.

To build for production:

```bash
cd apps/mobile
npx expo export --platform web
```

This outputs static files to `apps/mobile/dist/` — deployable to any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.). SPA routing requires a catch-all redirect rule (all paths → `index.html`).

### 7. Run tests

Tests run against a separate Neon database branch (`unit-test`) to avoid touching your dev data.

1. Create a `unit-test` branch in your Neon project dashboard
2. Add its connection string to `apps/server/.env`:

```
DATABASE_URL_TEST="your-neon-unit-test-branch-connection-string"
```

3. Apply migrations to the test branch:

```bash
cd apps/server
pnpm migrate:test
```

4. Run tests:

```bash
pnpm test
```

Tests will refuse to run if `DATABASE_URL_TEST` is not set. After pulling new migrations, re-run `pnpm migrate:test` in `apps/server` to keep the test branch in sync.

### 8. Set up the admin panel (optional)

Create a separate Neon project for admin data and add to `apps/server/.env`:

```
ADMIN_DATABASE_URL="your-admin-neon-connection-string"
ADMIN_DIRECT_URL="your-admin-neon-direct-connection-string"
ADMIN_JWT_SECRET="a-different-secret-from-JWT_SECRET"
```

Run the admin migration and seed:

```bash
cd apps/server
npx prisma migrate dev --create-only --name init --schema=prisma/admin/schema.prisma
npx prisma migrate deploy --schema=prisma/admin/schema.prisma
pnpm seed:admin
```

Create `apps/admin/.env`:

```bash
cp apps/admin/.env.example apps/admin/.env
```

Edit `apps/admin/.env`:

```
VITE_API_URL=http://localhost:3000/api
VITE_API_KEY=must-match-API_KEY-in-server-env
```

Run the admin dashboard:

```bash
pnpm dev:admin
```

Default admin login: `admin@snapcals.com` / `admin123`

### 9. Build APK / iOS for testing

```bash
# Android APK (standalone, no dev server needed)
pnpm build:apk

# iOS (standalone, no dev server needed)
pnpm build:ios
```

EAS will provide a download link / QR code when the build completes. Install the APK directly on your Android device.

## In-App Purchases Setup

RevenueCat powers the subscription flow. The SDK requires production builds via `eas build` — it cannot be fully tested in Expo Go.

### Prerequisites

- Apple Developer account ($99/year) for iOS
- Google Play Console account ($25 one-time) for Android

### Store Setup

1. **App Store Connect:** Create your app, add a monthly auto-renewable subscription product (e.g., `snapcals_pro_monthly` at $4.99/month), configure a subscription group, and generate an in-app purchase key
2. **Google Play Console:** Create your app, add a monthly subscription product with a base plan, set pricing, and create Play Service Credentials (service account JSON)

### RevenueCat Dashboard

1. Create a RevenueCat project at [rev.cat](https://www.revenuecat.com/)
2. Add iOS app (with App Store Connect in-app purchase key) and Android app (with Play Service Credentials)
3. Create products mirroring your store products
4. Create an entitlement named `pro` and attach the subscription products
5. Create an offering named `default` containing the monthly package
6. Configure webhook URL: `https://your-server.com/api/webhooks/revenuecat` with the authorization header matching `REVENUECAT_WEBHOOK_SECRET`
7. Copy the iOS and Android public API keys into `apps/mobile/.env`

### EAS Build

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas build --profile ios-simulator --platform ios   # iOS Simulator
eas build --profile development --platform ios     # Physical iOS device
eas build --profile development --platform android # Physical Android device
```

### Testing

- **iOS:** Create a sandbox Apple ID in App Store Connect → Users and Access → Sandbox Testers
- **Android:** Add license testers in Google Play Console → Settings → License testing
- RevenueCat sandbox mode is enabled automatically in development builds

## Keeping the Server Awake (Render Free Tier)

Render's free tier spins down after 15 minutes of inactivity. To keep the server alive during active hours, set up a cron job at [cron-job.org](https://cron-job.org) (free) to ping the health endpoint:

- **URL:** `https://your-app.onrender.com/api/health`
- **Keepalive cron:** `*/14 7-21 * * *` (every 14 minutes, 7am–10pm)
- **Wake-up cron:** `50-55 6 * * *` (every minute from 6:50–6:55am)
- **Timezone:** Set to your local timezone

The wake-up job handles cold starts. After hours of inactivity, the first request triggers a boot that takes 30–90 seconds — longer than cron-job.org's request timeout. The rapid 6:50–6:55 burst ensures at least one request lands after the service finishes booting, keeping it warm for the 7:00 keepalive to take over.

## Roadmap

See [docs/roadmap.md](./docs/roadmap.md) for the full roadmap.

1. CRUD calorie tracking
2. AI autofill via Gemini API
3. AI chat for clarifying questions
4. Image-based food recognition
5. Code quality (Biome, testing)
6. Goal coaching
7. Auth enhancements (email verification, password reset, Google OAuth)
8. Subscription & usage limits
9. RevenueCat SDK integration
10. Weight log
11. Food source / provider field
12. Voice logging
13. Admin panel
14. PWA / mobile web version
