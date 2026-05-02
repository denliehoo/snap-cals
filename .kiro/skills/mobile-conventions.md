---
name: mobile-conventions
description: React Native coding conventions for the Snap Cals mobile app
---

## File Naming
- All files and folders use kebab-case (e.g. `home-screen.tsx`, `auth.store.ts`, `use-entry-form.ts`)
- No PascalCase or camelCase file names

## Import Aliases
- Use `@/` alias for all imports within the mobile app (maps to `src/`)
- Example: `import { api } from "@/services/api"` instead of `import { api } from "../../services/api"`
- Use relative imports (`./`) only for co-located files in the same directory
- `@snap-cals/shared` remains as-is for shared package imports

## Screen Structure
- Every screen is a folder in `src/screens/` with an `index.tsx` (e.g. `screens/home/index.tsx`)
- When a screen needs extracted logic, add a co-located hook file (e.g. `screens/entry-form/use-entry-form.ts`)
- Only move a hook to `src/hooks/` when it's used by multiple screens (e.g. `hooks/use-auth-form.ts`). Default is co-location.
- Screens are thin rendering layers — state, validation, and API calls go in hooks

## TypeScript Strictness

- Never use `any` — use proper types from libraries or define explicit interfaces
- Only use `any` as a last resort when no type exists and `unknown` won't work

## Code Style
- Destructure object props at the top of a component (e.g. `const { name, calories } = entry`) — keeps JSX clean and avoids repeating the object name
- When rendering repeated UI patterns, use a config array + `.map()` instead of duplicating JSX blocks

## Reusable Components
- Shared UI components live in `src/components/` (e.g. `form-field.tsx`, `button.tsx`, `fab.tsx`)
- Co-locate components in the screen folder when only used by that screen
- Only move a component to `src/components/` when it's used (or will be used) by multiple screens

## Theme Usage
- Never hardcode colors, font weights, font sizes, spacing, or border radii
- Always import from `src/theme.ts`
- Use `colors.textOnPrimary` for text on primary-colored backgrounds (not `"#fff"`)
- Use `fontWeight.bold`, `fontWeight.semibold`, etc. (not `"700"`, `"600"`)
- If a new token is needed, add it to the theme file first

## Error & Success Feedback
- **Validation errors**: Always display inline, directly below the relevant field using the `FormField` `error` prop. Never show validation errors in a banner or snackbar. Use per-field `fieldErrors` state (not a single error string) so each field shows its own message.
- **API errors**: Always show in an error snackbar via `useSnackbar().show(msg, "error")`. Never display API errors inline. Hooks should accept an `onError` callback instead of managing error state internally.
- Use `getErrorMessage(e, fallback)` from `@/utils/error` in all catch blocks — never inline `e instanceof Error ? e.message : "..."` directly
- When `onError` is used inside a `useCallback`, store it in a ref to avoid infinite re-renders:
  ```typescript
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  // then use onErrorRef.current?.(...) inside the callback
  ```
- **API success**: Show a success snackbar when the result isn't obvious from navigation alone. Examples:
  - Show snackbar: entry added/updated/deleted, goals saved
  - Skip snackbar: login/signup success (navigation change makes it obvious)
- Snackbar is provided by `components/snackbar.tsx` (`SnackbarProvider` wraps the app in `App.tsx`)

## Date Handling

## Side Effect Cleanup
- Always return a cleanup function from `useEffect` when using `setTimeout`, `setInterval`, event listeners, or subscriptions
- Clear timers on unmount to prevent state updates after the component is destroyed
- This avoids memory leaks and prevents errors in tests where components are torn down quickly

## Date Handling
- Always use `toLocalDateString()` from `@/utils/date` to get a `YYYY-MM-DD` string from a `Date` object
- Always use `parseLocalDate()` from `@/utils/date` to convert a `YYYY-MM-DD` string back to a `Date` object
- Never use `new Date().toISOString().split("T")[0]` — this converts to UTC first
- Never use `new Date("YYYY-MM-DD")` without a time component — JavaScript parses this as UTC midnight, not local

## Web Compatibility (PWA)

The same `apps/mobile` codebase compiles for web. Follow these rules:

- **Storage**: Import from `@/utils/storage` — never import `expo-secure-store` directly
- **Alerts**: Use `showAlert()` from `@/utils/alert` — never use `Alert.alert` directly
- **Native-only modules**: Create a `.web.ts`/`.web.tsx` counterpart — don't duplicate entire screens. Extract only the platform-specific piece into its own file with a `.web` override.
- **Stack screens**: Call `useWebRedirect()` from `@/hooks/use-web-redirect` and return `null` if redirecting
