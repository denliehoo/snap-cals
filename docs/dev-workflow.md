# Development Workflow

This is a guide for **you** (the human developer) on how to use the Kiro CLI agent workflow to build features and fix bugs in Snap Cals. You are the orchestrator — you decide what to build, when to move between phases, and when something is done. The agents do the heavy lifting within each phase, but you drive the process.

## Your agents

You have three agents configured in `.kiro/agents/`. Each has a focused role and restricted permissions.

| Agent   | Shortcut       | Switch command        | Can write to                          | Role                                        |
| ------- | -------------- | --------------------- | ------------------------------------- | ------------------------------------------- |
| PM      | `Ctrl+Shift+P` | `/agent swap pm`      | `docs/specs/**`, `docs/roadmap.md`    | Writes specs with acceptance criteria       |
| Default | (built-in)     | `/agent swap default` | Everything                            | Builds the feature full-stack               |
| QA      | `Ctrl+Shift+Q` | `/agent swap qa`      | `docs/specs/**`, `docs/roadmap.md`    | Reviews implementation against the spec     |

The PM and QA agents are intentionally restricted — they can't modify source code. This separation is the key idea: the agent that plans the work is not the agent that builds it, and the agent that reviews it is not the agent that wrote it.

## Feature workflow

Everything starts from the product backlog in `docs/roadmap.md`.

### Step 0: Pick what to build

Open `docs/roadmap.md`. This is your product backlog — a list of features, ideas, and improvements you want to build. You maintain this file yourself. Pick the next item you want to work on.

If the item doesn't exist yet, add it to the roadmap first. It can be rough — even a single line like "- [ ] Favorites — let users star entries for quick re-logging" is enough.

### Step 1: Plan (PM agent)

```
Ctrl+Shift+P
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

### Step 2: Build (default agent)

```
/agent swap default
/clear
```

The `/clear` is important — it gives the builder a fresh context so it's not anchored to the planning conversation. The spec file is the handoff artifact.

Then tell it what to build:

> "Implement the feature described in docs/specs/favorites.md"

The default agent reads the spec and builds everything: Prisma schema changes, migrations, Express endpoints, shared types, Zustand store, React Native screens. It follows all your existing skills (conventions, design system, architecture patterns).

After building, it should also:
- Update `docs/architecture.md` if new patterns or conventions were introduced
- Update `README.md` if new setup steps, env vars, or commands were added

### Step 3: QA (QA agent)

```
Ctrl+Shift+Q
/clear
```

Again, fresh context. The QA agent has never seen the build conversation — it only knows the spec and the code.

> "Review the implementation of favorites"

The QA agent will:
1. Read `docs/specs/favorites.md` and its acceptance criteria
2. Go through each criterion one by one, reading the implementation code for evidence
3. Run the test suite (`pnpm test`)
4. Write a QA report to `docs/specs/favorites-qa.md` with PASS/FAIL per criterion and a verdict
5. If the overall verdict is PASS, mark the feature as completed in `docs/roadmap.md`

The QA agent is prompted to be skeptical. It won't give the benefit of the doubt — stubs, missing error handling, and untested paths are automatic failures.

### Step 4: Fix (if QA found issues)

If the QA report says NEEDS WORK:

```
/agent swap default
/clear
```

> "Fix the issues in docs/specs/favorites-qa.md"

The default agent reads the QA report and addresses each failure.

### Step 5: Re-QA (if fixes were substantial)

Repeat step 3. For minor fixes (typos, missing null checks) you can use your own judgment on whether a full re-QA is needed.

### Step 6: Done

Once QA passes, the feature is complete. The QA agent will have already marked it done in `docs/roadmap.md`. Commit and move on to the next backlog item.

## Bug fix workflow

Not everything goes through the full plan → build → QA cycle. Bug fixes are simpler.

### Small bugs (obvious fix)

Use the default agent directly. No spec needed.

```
/agent swap default
```

> "The entry form crashes when protein is left blank — fix it"

Review the fix, test it yourself, commit.

### Larger bugs (unclear cause or multi-file fix)

If the bug is complex or you're not sure what's going wrong, use the QA agent first to investigate:

```
Ctrl+Shift+Q
```

> "Investigate: weekly view shows wrong totals when entries span midnight"

The QA agent will read the relevant code, trace the logic, and write up what it finds. It can't fix anything (no source code write access), but it'll tell you exactly what's wrong and where.

Then switch to the default agent to fix it:

```
/agent swap default
/clear
```

> "Fix the issue described by the QA agent: [paste or summarize the finding]"

### Bugs found during QA of a feature

These are handled in step 4 of the feature workflow — the QA report already describes them with file and line references. No separate bug workflow needed.

## When to `/clear`

Use `/clear` when switching between phases (plan → build → QA → fix). This gives each agent fresh context so it evaluates the work independently rather than being biased by the previous conversation.

You do **not** need to `/clear` when:
- Iterating within a phase (e.g., asking the PM agent to revise the spec)
- Doing a quick bug fix with the default agent
- Asking follow-up questions in the same phase

## File structure

```
docs/
├── architecture.md              # Updated by default agent during builds
├── roadmap.md                   # Product backlog — maintained by you, refined by PM, marked done by QA
├── dev-workflow.md              # This file (for you, the human)
└── specs/
    ├── <feature-name>.md        # Spec written by PM agent
    └── <feature-name>-qa.md     # QA report written by QA agent
```

## Summary

| Phase     | Agent   | Input                    | Output                              |
| --------- | ------- | ------------------------ | ----------------------------------- |
| Pick      | You     | `docs/roadmap.md`        | Decision on what to build next      |
| Plan      | PM      | Your description         | `docs/specs/<feature>.md` + roadmap update |
| Build     | Default | The spec                 | Working code + architecture/README updates |
| QA        | QA      | The spec + the code      | `docs/specs/<feature>-qa.md` + roadmap update if passed |
| Fix       | Default | The QA report            | Bug fixes                           |
