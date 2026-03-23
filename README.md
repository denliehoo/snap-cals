# Snap Cals

A mobile calorie and macro tracking app built with React Native and a custom Node.js backend. Users can log food entries, set daily nutrition goals, and view daily/weekly intake summaries.

This project was built as an experiment with agentic AI using [Kiro CLI](https://kiro.dev). AI skills in `.kiro/skills/` guide code generation conventions, and `docs/` contains the architecture decisions and implementation plan that the AI follows across sessions.

## AI-Assisted Development Approach

This project is built collaboratively with [Kiro CLI](https://kiro.dev), an agentic AI coding assistant. The workflow looks like this:

1. I describe a feature or task, and Kiro generates the implementation
2. I review the generated code — reading through it to understand the patterns and decisions
3. When I spot opportunities to refactor or establish coding standards, I ask Kiro to make those changes
4. I then ask Kiro to document the conventions in `.kiro/skills/` (so it follows them in future sessions) and in `docs/` (so they're visible to humans too)

This creates a feedback loop: the AI writes code, I shape the standards, and those standards feed back into how the AI writes the next piece of code. Over time the codebase stays consistent even though an AI is doing most of the typing.

Key files that drive this:

- `.kiro/skills/` — YAML-frontmatter skill files that guide Kiro's code generation (naming conventions, commit format, etc.)
- `docs/architecture.md` — architectural decisions and patterns
- `docs/phase-1-implementation-plan.md` — task-by-task plan that gets checked off as we go

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
│   └── server/          # Express API
├── packages/
│   └── shared/          # Shared TypeScript types and enums
├── docs/                # Implementation plans and roadmap
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

## Phase Roadmap

See [docs/phase-roadmap.md](./docs/phase-roadmap.md) for the full roadmap.

- **Phase 1:** CRUD calorie tracking
- **Phase 2:** AI autofill via Gemini API
- **Phase 3:** AI chat for clarifying questions
- **Phase 4:** Image-based food recognition
- **Phase 5:** Code quality (Biome, testing)
- **Phase 6:** Goal coaching
- **Phase 7:** Auth enhancements (email verification, password reset, Google OAuth)
- **Phase 8:** Subscription & usage limits
- **Phase 9:** RevenueCat SDK integration
