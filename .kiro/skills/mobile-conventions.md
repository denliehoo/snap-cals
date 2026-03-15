---
name: mobile-conventions
description: React Native coding conventions for the Snap Cals mobile app
---

## File Naming
- All files and folders use kebab-case (e.g. `home-screen.tsx`, `auth.store.ts`, `use-entry-form.ts`)
- No PascalCase or camelCase file names

## Screen Structure
- Every screen is a folder in `src/screens/` with an `index.tsx` (e.g. `screens/home/index.tsx`)
- When a screen needs extracted logic, add a co-located hook file (e.g. `screens/entry-form/use-entry-form.ts`)
- Only move a hook to `src/hooks/` when it's used by multiple screens (e.g. `hooks/use-auth-form.ts`). Default is co-location.
- Screens are thin rendering layers — state, validation, and API calls go in hooks

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
