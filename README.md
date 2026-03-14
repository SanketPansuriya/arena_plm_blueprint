# NextGen PLM

NextGen PLM is a cloud-native Product Lifecycle Management platform being built as a hackathon MVP. The project is designed around controlled product data, revisions, BOMs, documents, CAD references, change workflows, supplier collaboration, quality tracking, and compliance-ready traceability.

## Technology Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, and Storage

## Current Project Structure

- `src/app/(marketing)` -> public landing and auth entry pages
- `src/app/(app)` -> authenticated application routes
- `src/components/app` -> authenticated shell and internal app UI
- `src/components/marketing` -> public marketing page components
- `src/components/ui` -> reusable UI primitives
- `src/lib/supabase` -> browser and server Supabase clients
- `supabase/` -> local Supabase config, migrations, and seed files
- `ai/` -> persistent AI project context, workflow, and task tracking

## Environment Setup

Copy `.env.example` into `.env.local` and provide values for:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DEMO_USER_PASSWORD=ChangeMe123!
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are required for the app.
- `SUPABASE_SERVICE_ROLE_KEY` is required for the demo auth-user seed script.
- `DEMO_USER_PASSWORD` is optional; it defaults to `ChangeMe123!` if not set.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Next.js app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Supabase workflow scripts:

```bash
npm run db:start
npm run db:stop
npm run db:status
npm run db:reset
npm run db:push
npm run db:new -- create_products
npm run db:seed:users
```

## Supabase Workflow

This repository uses Supabase CLI migrations for schema changes.

1. Start local Supabase services:
   `npm run db:start`
2. Create a migration:
   `npm run db:new -- create_products`
3. Edit the generated SQL file in `supabase/migrations/`
4. Apply migrations locally:
   `npm run db:reset`
5. Seed demo auth users if service-role credentials are configured:
   `npm run db:seed:users`
6. Push migrations to the linked project when appropriate:
   `npm run db:push`

Related files:

- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/seed.sql`
- `scripts/seed-demo-users.mjs`

## Demo Seed Data

Current seed support includes:

- a demo organization in `supabase/seed.sql`
- a demo product and revision in `supabase/seed.sql`
- demo parts and revisions in `supabase/seed.sql`
- demo auth users in `scripts/seed-demo-users.mjs`

The SQL seed is table-aware so it can run safely while the schema is still being built incrementally.

## Authentication Status

The project currently has:

- browser and server Supabase client helpers
- middleware that restores the Supabase session
- public `sign-in` and `sign-up` pages backed by Supabase Auth
- auth-user provisioning into `public.users` via a Supabase trigger migration

The full Supabase Auth UI and protected-route behavior are tracked in `ai/todo-task-list.md`.

## AI Workflow Files

The repository includes persistent AI guidance so development can resume after session resets:

- `ai/skills.md` -> primary AI workflow guide
- `ai/agent.yaml` -> agent definition
- `ai/agent-workflow.md` -> repository development workflow
- `ai/context.md` -> product scope
- `ai/architecture.md` -> system architecture
- `ai/database.md` -> schema planning
- `ai/todo-task-list.md` -> pending tasks
- `ai/completed-task-list.md` -> completed tasks

## Current Development Focus

The next work items are tracked in `ai/todo-task-list.md`. At this stage, setup is mostly complete and the next tasks move deeper into authentication, schema creation, and PLM module implementation.
