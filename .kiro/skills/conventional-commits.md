---
name: conventional-commits
description: Use conventional commit message format (feat, fix, chore, docs) when committing code. Never commit or push without explicit user confirmation.
---

## Git Safety

Never run `git commit` or `git push` without explicit confirmation from the user. Even if the user says "commit and push", always show the proposed commit message and list of staged files first, then ask for a go-ahead before executing. No exceptions.

## Commit Format

Use conventional commit messages when committing code:

- `feat:` — new functionality or features
- `fix:` — bug fixes
- `chore:` — setup, config, tooling, non-functional changes
- `refactor:` — code restructuring without changing behavior
- `docs:` — documentation only changes

Format: `type: short description`

Keep the subject line concise. Add a body with bullet points for details when the change is non-trivial.
