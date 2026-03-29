---
name: build-feature
description: End-to-end feature build workflow — reads conventions, builds from spec, runs checks, and iterates with QA subagent until all acceptance criteria pass.
---

When the user asks you to build a feature using this skill, follow this sequence exactly. Do not skip or reorder steps.

## Phase 1: Read before writing

Before writing any code, read all of the following:

1. Every file in `.kiro/skills/` — these are your coding conventions. List each skill name as you read it to confirm.
2. `docs/architecture.md` — existing patterns, models, routes, and decisions.
3. The spec file the user referenced (e.g. `docs/specs/<feature>.md`) — this defines what to build and how to verify it.

Do not proceed to Phase 2 until all three are read.

## Phase 2: Build

Build the feature full-stack as described in the spec:
- Prisma schema changes + migration (`--create-only` then `migrate deploy`, then `pnpm migrate:test`)
- Shared types in `packages/shared`
- Server controller, routes, register in `app.ts`
- Server-side tests for new endpoints (follow existing patterns in `src/__tests__/`)
- Mobile screens, hooks, stores, API methods, navigation changes

After building, run these checks and fix any issues before proceeding:
1. `pnpm check` — Biome lint/format. Fix any errors in files you created or modified.
2. `pnpm test` — all tests must pass. Fix any failures caused by your changes (including updating existing tests that broke due to your changes).
3. Update `docs/architecture.md` if you introduced new models, routes, libraries, patterns, or navigation changes.
4. Update `README.md` if you added new env vars, setup steps, or commands.

## Phase 3: QA loop

Use the `use_subagent` tool to invoke the QA subagent with these exact parameters:

- **agent_name**: `qa`
- **query**: `Review the implementation of <feature-name>. The spec is at docs/specs/<feature-name>.md. Go through every acceptance criterion, read the implementation code for evidence, run the test suite (pnpm test), and write a QA report to docs/specs/<feature-name>-qa.md with PASS/FAIL per criterion and an overall verdict. If the overall verdict is PASS, mark the feature as completed in docs/roadmap.md.`

Replace `<feature-name>` with the actual feature name from the spec filename.

After the QA subagent returns:

1. Read `docs/specs/<feature-name>-qa.md` to see the full report.
2. If verdict is **PASS** — tell the user the feature is done and ready to commit. Stop here.
3. If verdict is **NEEDS WORK**:
   a. Fix every failure listed in the QA report.
   b. Re-run `pnpm check` and `pnpm test` to verify fixes.
   c. Spawn the QA subagent again using the exact same parameters above, but add to the query: `This is a re-review. The previous QA report is at docs/specs/<feature-name>-qa.md — the failures have been fixed. Overwrite the report with updated results.`
   d. Read the new report. If still NEEDS WORK, repeat from step 3. Continue until verdict is PASS.

Maximum 3 QA iterations. If still failing after 3 rounds, stop and tell the user what's unresolved so they can intervene.

## Rules

- Never commit or push without explicit user confirmation.
- Never skip Phase 1 — this is the #1 cause of rework.
- The QA subagent has its own isolated context — it evaluates the code independently from your build conversation.
- Always use agent_name `qa` when spawning the QA subagent — do not use the default agent.
