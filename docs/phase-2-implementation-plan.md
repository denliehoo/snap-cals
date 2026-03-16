# Phase 2 Implementation Plan — AI Autofill

## Problem Statement

Users currently have to manually enter all nutrition data (calories, protein, carbs, fat, serving size) for every food entry. Phase 2 adds an AI-powered path where users describe a food item in natural language and the Gemini API returns estimated nutrition values, pre-filling the existing entry form for review and editing.

## Requirements

- User can type a rich, natural language food description (one food at a time), e.g. "grande oat milk latte" or "200g grilled chicken breast"
- Gemini API estimates calories, protein, carbs, fat, serving size, and a cleaned-up food name
- Estimates pre-fill the existing entry form; user can edit before saving
- AI calls go through the Express backend (API key stays server-side)
- The AI screen is designed as an extensible surface for Phase 3 (chat) and Phase 4 (image)
- Manual entry remains available as a fallback
- No usage tracking/paywall yet (deferred to Phase 5)
- Google OAuth deferred to a separate phase

## Tech Additions

| Layer      | Tech                                    | Notes                                              |
| ---------- | --------------------------------------- | -------------------------------------------------- |
| AI SDK     | `@google/genai` (unified Google GenAI)  | Replaces deprecated `@google/generative-ai`        |
| AI Model   | `gemini-2.5-flash`                      | Fast, free tier, supports structured JSON output    |
| Validation | `zod` + `zod-to-json-schema`            | Defines response schema for Gemini structured output|

## Proposed Solution

A dedicated "AI Assist" screen sits between the daily view and the entry form. The daily view FAB opens a bottom sheet with two options: "Manual Entry" (existing flow) and "AI Assist" (new flow). The AI Assist screen accepts a natural language food description, sends it to a new server endpoint that calls the Gemini API with structured output, and navigates to the existing entry form pre-filled with the AI estimates for user review.

This architecture is designed for forward compatibility:
- **Phase 3 (AI Chat):** The AI Assist screen gains a chat message list for back-and-forth refinement
- **Phase 4 (Image Input):** The AI Assist screen gains a camera/photo button alongside the text input
- **Phase 5 (Subscription):** The server endpoint gets a usage-check middleware wrapper

### Flow Diagram

```
Daily View → FAB tap → Bottom Sheet
  ├── "Manual Entry" → Entry Form (empty, current behavior)
  └── "AI Assist"    → AI Assist Screen
                          ├── User types food description
                          ├── Taps "Estimate"
                          ├── POST /api/ai/estimate → Gemini API (structured JSON)
                          └── Navigate to Entry Form (pre-filled)
                                └── User reviews/edits → saves normally
```

### Architecture Diagram

```mermaid
graph TD
    A[Daily View - FAB] --> B[Bottom Sheet]
    B --> C[Manual Entry → Entry Form]
    B --> D[AI Assist Screen]
    D -->|POST /api/ai/estimate| E[Express Backend]
    E -->|@google/genai SDK| F[Gemini API]
    F -->|Structured JSON| E
    E -->|AiEstimateResponse| D
    D -->|prefill params| G[Entry Form - pre-filled]
    G --> H[User reviews/edits + saves]
```

### Shared Types

```typescript
// Added to packages/shared
interface AiEstimateRequest {
  description: string;
}

interface AiEstimateResponse {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}
```

### New Files

```
apps/server/src/
├── services/
│   └── gemini.service.ts      # Gemini SDK client + estimateNutrition()
├── controllers/
│   └── ai.controller.ts       # POST /api/ai/estimate handler
└── routes/
    └── ai.routes.ts            # /api/ai route registration

apps/mobile/src/
├── components/
│   └── action-sheet.tsx        # Reusable bottom sheet menu
└── screens/
    └── ai-assist/
        ├── index.tsx           # AI Assist screen
        └── use-ai-assist.ts   # Screen hook (API call, state)
```

### Modified Files

```
packages/shared/src/index.ts          # Add AiEstimateRequest, AiEstimateResponse
apps/server/src/app.ts                # Register /api/ai routes
apps/server/.env.example              # Add GEMINI_API_KEY
apps/mobile/src/services/api.ts       # Add estimateNutrition method
apps/mobile/src/navigation.tsx        # Add AiAssist route to MainStackParamList
apps/mobile/src/screens/daily-view/   # FAB opens action sheet instead of direct nav
apps/mobile/src/screens/entry-form/   # Accept prefill param, show "Review AI Estimate" title
```

## Task Breakdown

### Task 1: Shared types and server-side Gemini service ✅

- **Objective:** Add AI-related shared types and create a Gemini service module on the server that takes a food description and returns structured nutrition data.
- **Guidance:**
  - Add `AiEstimateRequest` and `AiEstimateResponse` interfaces to `packages/shared/src/index.ts`
  - Install `@google/genai`, `zod`, and `zod-to-json-schema` in `apps/server`
  - Create `apps/server/src/services/gemini.service.ts` — initialize `GoogleGenAI` client with `GEMINI_API_KEY` from env, define a Zod schema for the nutrition response, export `estimateNutrition(description: string)`
  - Call `ai.models.generateContent()` with `gemini-2.5-flash`, a system prompt instructing it to estimate nutrition for the described food (one item, standard serving if quantity not specified), `responseMimeType: "application/json"`, and `responseJsonSchema` from the Zod schema
  - Parse and validate the response with the Zod schema before returning
  - Add `GEMINI_API_KEY` to `.env.example`
- **Test:** Unit test the Gemini service with a mocked `@google/genai` client — verify it sends the right prompt structure and parses a valid response. Verify it throws a meaningful error on invalid/empty responses.
- **Demo:** Run the service function directly with "grilled chicken breast 200g" and see structured JSON output.

### Task 2: AI estimate API endpoint ✅

- **Objective:** Expose a `POST /api/ai/estimate` endpoint that accepts a food description and returns nutrition estimates.
- **Guidance:**
  - Create `apps/server/src/controllers/ai.controller.ts` with an `estimate` handler that validates the request body (`description` required, non-empty), calls the Gemini service, returns result wrapped in `ApiResponse<AiEstimateResponse>`
  - Create `apps/server/src/routes/ai.routes.ts` and register in `app.ts` under `/api/ai`
  - Route is protected via JWT auth (same middleware as entries/goals)
  - Handle Gemini errors gracefully (rate limit, invalid response, network error) with appropriate HTTP status codes
- **Test:** Integration test with Supertest — verify 401 without token, 400 with empty description, 200 with valid description (mock Gemini service to avoid real API calls). Verify response shape matches `ApiResponse<AiEstimateResponse>`.
- **Demo:** Use curl/Postman to `POST /api/ai/estimate` with `{"description": "big mac"}` and see structured nutrition JSON.

### Task 3: Bottom sheet FAB menu on Daily View ✅

- **Objective:** Replace the single FAB with a FAB that opens a bottom sheet offering "Manual Entry" and "AI Assist" options.
- **Guidance:**
  - Create a reusable `ActionSheet` component in `apps/mobile/src/components/action-sheet.tsx` — a modal bottom sheet with a list of labeled options (icon + text), using theme tokens
  - Update Daily View: tapping FAB opens action sheet instead of navigating directly to EntryForm
  - "Manual Entry" navigates to `EntryForm` (same as current behavior)
  - "AI Assist" navigates to a new `AiAssist` screen
  - Add `AiAssist` screen route to `MainStackParamList` in navigation
- **Test:** Verify FAB tap opens action sheet. Verify "Manual Entry" navigates to EntryForm. Verify "AI Assist" navigates to AI Assist screen.
- **Demo:** Tap FAB on daily view → see bottom sheet with two options → tap each and see correct navigation.

### Task 4: AI Assist screen with text input and API integration ✅

- **Objective:** Build the AI Assist screen where users type a food description, tap "Estimate", and see loading state while the API call happens.
- **Guidance:**
  - Create `apps/mobile/src/screens/ai-assist/index.tsx` and `use-ai-assist.ts`
  - Screen has: text input for food description, "Estimate" button, loading state, error display
  - Hook calls `api.estimateNutrition(description)` (new method in `services/api.ts`)
  - Add `estimateNutrition` to api service — `POST /api/ai/estimate`
  - On success, navigate to `EntryForm` with AI response as a `prefill` route param
  - Show disclaimer: "AI estimates may not be exact — review before saving"
  - Button disabled when input is empty
- **Test:** Verify screen renders with input and button. Verify button disabled when empty. Verify loading state during API call. Verify successful response navigates to EntryForm.
- **Demo:** Type "grande oat milk latte" → tap Estimate → loading → land on EntryForm with macros pre-filled.

### Task 5: Entry form pre-fill support

- **Objective:** Update the entry form to accept pre-filled data from the AI Assist screen.
- **Guidance:**
  - Update `MainStackParamList` to add optional `prefill` param to `EntryForm` route (type: `AiEstimateResponse`)
  - Update `use-entry-form.ts` to accept `prefill` — when present (and no `entry` for edit mode), initialize form fields from prefill data
  - Form title shows "Review AI Estimate" when pre-filled (vs "Add Entry" / "Edit Entry")
  - Save flow is identical to manual entry
  - Handle AI returning 0 for some macros correctly
- **Test:** Verify form fields populated from prefill. Verify user can edit pre-filled fields. Verify save works with pre-filled data. Verify edit mode still works (entry param takes precedence).
- **Demo:** Full flow — Daily View → FAB → AI Assist → type food → Estimate → Entry Form pre-filled → edit → save → entry in daily view.

### Task 6: Wiring, error handling, and polish

- **Objective:** End-to-end integration, edge case handling, UX polish, and documentation.
- **Guidance:**
  - Handle network errors on AI Assist screen (show error with retry suggestion)
  - Handle Gemini rate limiting ("AI is busy, try again in a moment")
  - Loading spinner on Estimate button while waiting
  - Back navigation: AI Assist → back → Daily View (no loops)
  - Update `docs/phase-roadmap.md` to mark Phase 2 status
  - Update `docs/architecture.md` with AI service layer and `/api/ai/estimate` endpoint
  - Add `GEMINI_API_KEY` setup instructions to README
- **Test:** Full end-to-end flow works. Error states display correctly. Navigation correct. Manual entry unaffected.
- **Demo:** Complete walkthrough: Daily View → FAB → AI Assist → estimate → review → save. Also: error handling when API fails, manual entry still works.

### Task 7: Comprehensive test coverage

- **Objective:** Add missing frontend and backend tests for all Phase 2 features.
- **Guidance:**
  - **Backend:** Ensure integration tests exist for `POST /api/ai/estimate` (already done in Task 2 — verify coverage is complete)
  - **Frontend:** Add React Native Testing Library tests for:
    - ActionSheet component (renders options, calls onPress, dismisses on backdrop tap)
    - Daily View FAB (opens action sheet, "Manual Entry" navigates to EntryForm, "AI Assist" navigates to AiAssist)
    - AI Assist screen (renders input and button, button disabled when empty, loading state, successful response navigates to EntryForm with prefill)
    - Entry Form prefill (fields populated from prefill param, user can edit, save works, edit mode unaffected)
  - Follow existing mobile testing conventions in `.kiro/skills/mobile-testing-conventions.md`
- **Test:** All new tests pass. Existing tests unaffected.
- **Demo:** Run full test suite for both server and mobile — all green.
