---
name: prisma-migrations
description: Safe Prisma migration workflow — never run migrate dev without --create-only against databases with data.
---

## Migration Workflow

1. Generate the migration file without applying it:
   ```bash
   npx prisma migrate dev --create-only --name <name>
   ```
2. Review the generated SQL in `prisma/migrations/`
3. Apply to dev DB: `npx prisma migrate deploy`
4. Apply to test DB: `pnpm migrate:test` (in `apps/server`)

## Rules

- **Never** run `prisma migrate dev` without `--create-only` — it can reset the entire database if it detects drift
- **Never** run `prisma db push` against dev or production databases — it can drop columns/tables to match the schema
- **Always** use `prisma migrate deploy` to apply migrations — it never resets, never prompts, and fails safely on conflicts
- If a Prisma command prompts to reset or drop data, **stop immediately** and do not confirm
- After pulling new migrations, run both `prisma migrate deploy` and `pnpm migrate:test` to keep both databases in sync
