---
name: server-conventions
description: Express/Node.js coding conventions for the Snap Cals server app
---

## Shared Types

- All request/response interfaces live in `packages/shared/src/index.ts`
- Both the server and mobile app import from `@snap-cals/shared`
- Never define request/response shapes inline — use the shared types

## Controller Typing

- Use Express generic `Request<Params, ResBody, ReqBody>` to type request bodies:
  ```typescript
  import { CreateFoodEntryRequest } from "@snap-cals/shared";
  export const create = async (req: Request<{}, {}, CreateFoodEntryRequest>, res: Response) => {
  ```
- This ensures `req.body` is typed and the compiler catches mismatches with the shared contract

## Controller Pattern

- Validate request body → call service → return `{ data }` wrapped response
- Error responses: `{ message }` with appropriate status (400, 404, 429, 500)
- Rate limit errors from external APIs → 429

## TypeScript Strictness

- Never use `any` — use proper types from libraries or define explicit interfaces
- Only use `any` as a last resort when no type exists and `unknown` won't work

## File Structure

- Controllers: `src/controllers/<name>.controller.ts`
- Services: `src/services/<name>.service.ts`
- Routes: `src/routes/<name>.routes.ts`
