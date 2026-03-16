---
name: mobile-testing-conventions
description: Conventions for writing and organizing frontend tests in the Snap Cals mobile app (apps/mobile)
---

## Test Location
- Co-locate tests next to the file they test (e.g. `screens/login/index.test.tsx`, `components/button.test.tsx`)
- Shared test utilities live in `src/__tests__/helpers.tsx`

## Custom Render
- Always import `render` from `@/__tests__/helpers` — never directly from `@testing-library/react-native`
- The custom `render` automatically wraps components in `ThemeProvider` and `SnackbarProvider`
- `render` is async — always `await render(<Component />)`

## Test Structure
- Use `jest.mock()` for external dependencies (API calls, secure store, navigation)
- Use `beforeEach(() => jest.clearAllMocks())` to reset mocks between tests
- Mock navigation objects with `as any` — don't over-type test fixtures
- Use `waitFor` for assertions on async state updates

## What to Test
- Form validation behavior (required fields, min length, invalid values)
- Screen rendering with expected text, inputs, and buttons
- User interactions (press, type, navigate)
- API calls triggered with correct arguments
- Error states displayed to the user
- Edit vs create mode differences

## What Not to Test
- Styles and layout (visual regression is better handled by snapshot or Storybook)
- Internal hook state — test through the rendered UI instead
- Third-party library internals
