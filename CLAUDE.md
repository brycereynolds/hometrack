# HomeTrack — Claude Code Instructions

## Drizzle Migrations

- **Always** use `--name` when generating migrations: `npx drizzle-kit generate --name=descriptive_name`
- Migration names must be meaningful and describe the change (e.g., `add_thumbnail_url`, `create_action_moments_junction`, `fix_rls_grants`)
- Never generate migrations without `--name` — Drizzle's default random names (e.g., `small_marvel_apes`) are not acceptable
