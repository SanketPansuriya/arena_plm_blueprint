# Supabase Migration Workflow

This project uses the Supabase CLI migration flow for database schema changes.

## Folder Structure

- `supabase/config.toml` -> local Supabase project configuration
- `supabase/migrations/` -> ordered SQL migrations
- `supabase/seed.sql` -> local seed script placeholder for future demo data
- `scripts/seed-demo-users.mjs` -> creates demo auth users and syncs app profiles when available

## Local Workflow

1. Start local Supabase services:
   - `npm run db:start`
2. Create a new migration:
   - `npm run db:new -- create_products`
3. Edit the generated SQL file in `supabase/migrations/`
4. Apply migrations to the local database:
   - `npm run db:reset`
5. Check local service status:
   - `npm run db:status`
6. Seed demo auth users after local services are running:
   - `npm run db:seed:users`
7. Push migrations to the linked Supabase project when ready:
   - `npm run db:push`

## Working Rules

- Keep each schema change in its own migration file.
- Prefer additive migrations instead of rewriting old migrations after they have been used.
- Use `db reset` locally while development is still early and seed-safe.
- Keep migration names short and task-oriented, for example `create_products`.
- Put shared helper SQL in early migrations so later table migrations can reuse it.
- Keep demo auth users in the admin seed script because Supabase Auth accounts are separate from app tables.
