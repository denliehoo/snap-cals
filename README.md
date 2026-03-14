# Snap Cals

A mobile calorie and macro tracking app built with React Native and a custom Node.js backend. Users can log food entries, set daily nutrition goals, and view daily/weekly intake summaries.

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
```

### 3. Run the backend

```bash
pnpm dev:server
```

The API will be available at `http://localhost:3000`. Test it with:

```bash
curl http://localhost:3000/api/health
```

### 4. Run the mobile app

In a separate terminal:

```bash
pnpm dev:mobile
```

This starts the Expo dev server. Then either:
- Scan the QR code with Expo Go on your phone
- Press `i` for iOS Simulator
- Press `a` for Android Emulator

## Phase Roadmap

See [docs/phase-roadmap.md](./docs/phase-roadmap.md) for the full roadmap.

- **Phase 1:** CRUD calorie tracking (current)
- **Phase 2:** AI autofill via Gemini API
- **Phase 3:** AI chat for clarifying questions
- **Phase 4:** Image-based food recognition
