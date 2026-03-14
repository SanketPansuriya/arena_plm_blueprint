# Completed Task List

## Setup

- Initialize the project with Next.js App Router, TypeScript, ESLint, and Tailwind CSS.
- Add Supabase client dependencies to the application.
- Add `.env.example` with Supabase URL and anon key placeholders.
- Set up the root application layout and global stylesheet.
- Replace the default Next.js landing page with a PLM-branded home page.
- Create route groups for public pages and authenticated app pages.
- Build a shared application shell with top navigation and module sidebar.
- Create reusable UI components for tables, forms, drawers, and status badges.
- Set up a Supabase migration workflow for schema changes.
- Add seed data for a demo organization, users, products, and parts.
- Update the README with local setup and environment instructions.

## Authentication

- Create a browser-side Supabase client helper.
- Create a server-side Supabase client helper.
- Add Supabase auth profile provisioning migration for `public.users`.
- Add middleware that restores the Supabase session on incoming requests.
- Build a sign-in page with Supabase Auth.
- Build a sign-up page with Supabase Auth.
- Build a sign-out action for authenticated users.
- Redirect unauthenticated users away from protected app routes.
- Load the signed-in user profile and organization after login.
- Add role checks for `admin`, `engineer`, `approver`, and `supplier`.
- Show an unauthorized state when a user lacks page access.

## Product Management

- Create foundational database tables for organizations and users.
- Create database tables for products and product revisions.
- Create database tables for parts and part revisions.
- Create database tables for BOMs and BOM items.
- Create database tables for documents and document revisions.
- Create database tables for CAD files and CAD file revisions.
- Create database tables for specifications and requirements.
- Build a product list page.
- Build a product detail page with revision history.
- Build a part library page.
- Build a part detail page with linked usages.

## Lifecycle Tracking

- No completed tasks yet.

## Dashboard

- No completed tasks yet.

## Collaboration

- No completed tasks yet.
