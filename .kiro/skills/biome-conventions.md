---
name: biome-conventions
description: Biome formatting and linting conventions — follow these when generating code so it passes `pnpm check` without fixes needed
---

## Formatting

- 2-space indentation (spaces, not tabs)
- Double quotes for strings
- Biome handles trailing commas, semicolons, and line width — don't fight the formatter

## Imports

- Use `import type { X }` for type-only imports (Biome enforces this)
- Don't import `React` as a default import — the new JSX transform doesn't need it
- Keep imports organized: Biome auto-sorts them (external → internal → relative)

## Linting Rules to Follow

- No unused imports or variables (prefix intentionally unused params with `_`)
- No `any` — use proper types. For catch blocks use `unknown` and narrow:
  ```typescript
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Something went wrong";
  }
  ```
- No non-null assertions (`!`) — use optional chaining (`?.`) or proper null checks
- No `{}` as a type — use `Record<string, never>` for empty objects or a specific type
- Use `Number.isNaN()` instead of global `isNaN()`
- Use `node:` protocol for Node.js built-in imports (e.g., `import path from "node:path"`)
- Use template literals instead of string concatenation
- Use dot notation for property access when possible (e.g., `obj.key` not `obj["key"]`)
- Specify all dependencies in React hook dependency arrays (`useEffect`, `useCallback`, `useMemo`)

## Running

- `pnpm check` — lint + format in one pass (runs `biome check --write`)
- `pnpm lint` — lint only
- `pnpm format` — format only
