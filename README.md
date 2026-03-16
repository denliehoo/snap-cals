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

| Layer | Tech |
|-------|------|
| Frontend | React Native + Expo + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | Postgres + Prisma ORM |
| Auth | Passport.js + JWT |
| State Management | Zustand |
| Navigation | React Navigation |
| Monorepo | pnpm workspaces |

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
```

Get a free Postgres database at [neon.tech](https://neon.tech) — copy the connection string from the Neon dashboard. Get a free Gemini API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Required for AI food estimation features.

### 3. Run database migrations and seed

```bash
cd apps/server
npx prisma migrate dev
npx ts-node -r tsconfig-paths/register prisma/seed.ts
```

The seed creates a test account you can use:

- Email: `test@example.com`
- Password: `password123`

To explore the database visually:

```bash
npx prisma studio
```

### 4. Run the backend

```bash
pnpm dev:server
```

The API will be available at `http://localhost:3000`. Test it with:

```bash
curl http://localhost:3000/api/health
```

### 5. Run the mobile app

In a separate terminal:

```bash
pnpm dev:mobile
```

This starts the Expo dev server. Then either:
- Scan the QR code with Expo Go on your phone
- Press `i` for iOS Simulator
- Press `a` for Android Emulator

### 6. Run tests

Tests run against a separate Neon database branch (`unit-test`) to avoid touching your dev data.

1. Create a `unit-test` branch in your Neon project dashboard
2. Add its connection string to `apps/server/.env`:

```
DATABASE_URL_TEST="your-neon-unit-test-branch-connection-string"
```

3. Run tests:

```bash
pnpm test
```

Tests will refuse to run if `DATABASE_URL_TEST` is not set.

## Phase Roadmap

See [docs/phase-roadmap.md](./docs/phase-roadmap.md) for the full roadmap.

- **Phase 1:** CRUD calorie tracking (current)
- **Phase 2:** AI autofill via Gemini API
- **Phase 3:** AI chat for clarifying questions
- **Phase 4:** Image-based food recognition
