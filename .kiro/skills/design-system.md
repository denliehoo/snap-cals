---
name: design-system
description: Visual design system for Snap Cals — color palette, shadows, cards, and UI patterns
---

## Color Palette — Light Mode

| Token         | Value     | Usage                                   |
| ------------- | --------- | --------------------------------------- |
| primary       | `#1B5E3B` | Buttons, active states, progress fills  |
| primaryLight  | `#E8F5E9` | Subtle highlights, selected backgrounds |
| primaryDark   | `#0D3B25` | Header text on light backgrounds        |
| background    | `#F5F5F0` | Screen background (warm off-white)      |
| surface       | `#FFFFFF` | Cards, modals, inputs                   |
| text          | `#1A1A2E` | Primary text                            |
| textSecondary | `#6B7280` | Labels, meta text, placeholders         |
| border        | `#E5E5E0` | Dividers, input borders                 |
| error         | `#C0392B` | Destructive actions, over-goal          |
| success       | `#1B5E3B` | Confirmation, on-target                 |
| warning       | `#D4A03C` | Caution states                          |
| calorieColor  | `#D4654A` | Muted coral-red                         |
| proteinColor  | `#5B7FA5` | Muted slate blue                        |
| carbsColor    | `#C4883A` | Muted warm amber                        |
| fatColor      | `#8B6BAE` | Muted soft purple                       |
| textOnPrimary | `#FFFFFF` | Text on primary-colored backgrounds     |

## Color Palette — Dark Mode

| Token         | Value     | Usage                               |
| ------------- | --------- | ----------------------------------- |
| background    | `#000000` | Screen background (true black)      |
| surface       | `#1C1C1E` | Cards, modals, inputs               |
| text          | `#F5F5F5` | Primary text                        |
| textSecondary | `#8E8E93` | Labels, meta text                   |
| border        | `#38383A` | Dividers, input borders             |
| primaryLight  | `#1B3D2E` | Subtle highlights on dark           |
| calorieColor  | `#E8785E` | Slightly brighter for dark contrast |
| proteinColor  | `#7A9DBF` | Slightly brighter for dark contrast |
| carbsColor    | `#D9A04E` | Slightly brighter for dark contrast |
| fatColor      | `#A484C4` | Slightly brighter for dark contrast |

Primary, primaryDark, error, success, warning stay the same in both modes.

## Shadow Tokens

Use platform-specific shadows (iOS `shadow*` + Android `elevation`):

- `shadow.sm` — subtle card lift (elevation 2, shadowOpacity 0.08)
- `shadow.md` — raised elements like FAB (elevation 4, shadowOpacity 0.12)
- `shadow.lg` — modals, overlays (elevation 8, shadowOpacity 0.16)

## Card Preset

All cards use: `{ backgroundColor: surface, borderRadius: 12, padding: spacing.md, ...shadow.sm }`

No `borderWidth` or `borderBottomWidth` on cards — shadows provide separation.

## Opacity

- Disabled elements: `0.5`
- Overlay backgrounds: `0.4`

## Design Rules

- **Cards over borders**: Use cards with subtle shadows instead of `borderBottom` dividers for list items
- **Progress bars for goals**: Show macro progress as horizontal fill bars, not just "current / goal" text. Bar fills with the macro's accent color, background is `border` color
- **Section headers**: Bold text + thin 1px divider below. No colored backgrounds (remove `primaryLight` section headers)
- **Empty states**: Centered icon (from a lightweight icon set) + descriptive message + optional action button
- **Spacing rhythm**: Stick to the 8px grid — `xs: 4, sm: 8, md: 16, lg: 24, xl: 32`
- **No saturated Material colors**: All accent colors are muted/desaturated. Never use stock Material palette values
- **Typography hierarchy**: `xxl` + `bold` for screen titles, `lg` + `bold` for primary numbers (calories), `md` + `medium` for secondary info, `sm`/`xs` for labels and meta
- **Dark mode**: Use ThemeContext to resolve colors. Components never hardcode light or dark values — always reference theme tokens

## Reusable Components

| Component      | Path                              | Usage                                                  |
| -------------- | --------------------------------- | ------------------------------------------------------ |
| Button         | `components/button.tsx`           | All tappable actions — supports `loading`, `variant`   |
| FormField      | `components/form-field.tsx`       | Labeled text inputs with inline error display           |
| ThemedSwitch   | `components/themed-switch.tsx`    | Drop-in `Switch` with themed track and thumb colors    |
| Snackbar       | `components/snackbar.tsx`         | Toast-style feedback — API errors (`"error"`) and success (`"success"`) |

Always use `ThemedSwitch` instead of the raw React Native `Switch` to ensure consistent styling across platforms.
