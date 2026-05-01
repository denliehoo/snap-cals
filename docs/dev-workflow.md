# Development Workflow

This is a guide for **you** (the human developer) on how to use the Kiro CLI agent workflow to build features and fix bugs in Snap Cals. You are the orchestrator — you decide what to build, when to move between phases, and when something is done. The agents do the heavy lifting within each phase, but you drive the process.

## Your agents

You have three agents configured in `.kiro/agents/`. Each has a focused role and restricted permissions.

| Agent   | Switch command        | Can write to                       | Role                                    |
| ------- | --------------------- | ---------------------------------- | --------------------------------------- |
| PM      | `/agent swap pm`      | `docs/specs/**`, `docs/roadmap.md` | Writes specs with acceptance criteria   |
| Builder | `/agent swap builder` | Everything                         | Builds the feature full-stack           |
| QA      | `/agent swap qa`      | `docs/specs/**`, `docs/roadmap.md` | Reviews implementation against the spec |

Switch agents using `/agent swap <name>` (e.g., `/agent swap pm`). Keyboard shortcuts are configured in each agent's JSON file but may not work in all terminals (e.g., VS Code's integrated terminal intercepts many key combos). The `/agent swap` command always works.

The PM and QA agents are intentionally restricted — they can't modify source code. This separation is the key idea: the agent that plans the work is not the agent that builds it, and the agent that reviews it is not the agent that wrote it.

## Feature workflow

Everything starts from the product backlog in `docs/roadmap.md`.

### Step 0: Pick what to build

Open `docs/roadmap.md`. This is your product backlog — a list of features, ideas, and improvements you want to build. You maintain this file yourself. Pick the next item you want to work on.

If the item doesn't exist yet, add it to the roadmap first. It can be rough — even a single line like "- [ ] Favorites — let users star entries for quick re-logging" is enough.

### Step 1: Plan (PM agent)

```
/agent swap pm
```

Tell the PM agent what you want to build. Reference the roadmap item if it helps:

> "I want to build the favorites feature from the roadmap — users should be able to star food entries and re-log them quickly."

The PM agent will:

1. Ask you clarifying questions (scope, edge cases, UX expectations)
2. Review the existing codebase, architecture docs, shared types, and Prisma schema
3. Write a spec to `docs/specs/<feature-name>.md` with:
   - Problem statement
   - User stories
   - Acceptance criteria (every one must be testable — the QA agent will verify these later)
   - Data model changes, API changes, UI/UX notes
4. Update `docs/roadmap.md` — refine the backlog entry with the agreed scope and link to the spec

**Don't move on until you're happy with the spec.** Read through the acceptance criteria carefully. If something is missing or wrong, tell the PM agent to revise it. This is the cheapest place to catch mistakes — before any code is written.

### Step 2: Build + QA (builder agent)

```
/agent swap builder
/clear
```

The `/clear` is important — it gives the builder a fresh context so it's not anchored to the planning conversation. The spec file is the handoff artifact.

Then tell it to build using the skill:

> "Using the build-feature skill, implement docs/specs/favorites.md"

That's it. The `build-feature` skill (`.kiro/skills/build-feature.md`) instructs the builder agent to:

1. **Read** — all skills in `.kiro/skills/`, `docs/architecture.md`, and the spec
2. **Build** — full-stack implementation following all conventions
3. **Check** — run `pnpm check`, `pnpm test`, `pnpm migrate:test`, update architecture/README
4. **QA loop** — spawn the QA subagent to review against the spec, fix any failures, re-spawn QA, repeat until all acceptance criteria pass
5. **Report** — tell you the feature is done and ready to commit

The agent handles the entire build→check→QA→fix cycle autonomously. You only intervene if you want to give feedback or redirect.

### Step 3: Done

Once the agent reports QA passed, the feature is complete. The QA subagent will have already marked it done in `docs/roadmap.md`. Commit and move on to the next backlog item.

## Bug fix workflow

Not everything goes through the full plan → build → QA cycle. Bug fixes are simpler.

### Small bugs (obvious fix)

Use the builder agent directly. No spec needed.

```
/agent swap builder
```

> "The entry form crashes when protein is left blank — fix it"

Review the fix, test it yourself, commit.

### Larger bugs (unclear cause or multi-file fix)

If the bug is complex or you're not sure what's going wrong, use the QA agent first to investigate:

```
/agent swap qa
```

> "Investigate: weekly view shows wrong totals when entries span midnight"

The QA agent will read the relevant code, trace the logic, and write up what it finds. It can't fix anything (no source code write access), but it'll tell you exactly what's wrong and where.

Then switch to the builder agent to fix it:

```
/agent swap builder
/clear
```

> "Fix the issue described by the QA agent: [paste or summarize the finding]"

### Bugs found during QA of a feature

These are handled automatically by the build-feature skill's QA loop — the QA report describes failures and the builder agent fixes them before re-running QA.

## When to `/clear`

Use `/clear` when switching from planning (PM agent) to building (builder agent). This gives the builder a fresh context so it's not anchored to the planning conversation.

You do **not** need to `/clear` when:

- Iterating within a phase (e.g., asking the PM agent to revise the spec)
- The build-feature skill is running (it handles QA internally via subagents with isolated context)
- Doing a quick bug fix with the builder agent
- Asking follow-up questions in the same phase

## File structure

```
docs/
├── architecture.md              # Updated by builder agent during builds
├── roadmap.md                   # Product backlog — maintained by you, refined by PM, marked done by QA
├── dev-workflow.md              # This file (for you, the human)
└── specs/
    ├── <feature-name>.md        # Spec written by PM agent
    └── <feature-name>-qa.md     # QA report written by QA agent
```

## Summary

| Phase    | Agent                   | Input                        | Output                                                                  |
| -------- | ----------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| Pick     | You                     | `docs/roadmap.md`            | Decision on what to build next                                          |
| Plan     | PM                      | Your description             | `docs/specs/<feature>.md` + roadmap update                              |
| Build+QA | Builder (+ QA subagent) | `build-feature` skill + spec | Working code + QA report + architecture/README updates + roadmap update |
