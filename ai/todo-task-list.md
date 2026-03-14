# Todo Task List

## Setup

- Replace the default Next.js landing page with a PLM-branded home page.
- Create route groups for public pages and authenticated app pages.
- Build a shared application shell with top navigation and module sidebar.
- Create reusable UI components for tables, forms, drawers, and status badges.
- Set up a Supabase migration workflow for schema changes.
- Add seed data for a demo organization, users, products, and parts.
- Update the README with local setup and environment instructions.

## Authentication

- Build a sign-in page with Supabase Auth.
- Build a sign-out action for authenticated users.
- Redirect unauthenticated users away from protected app routes.
- Load the signed-in user profile and organization after login.
- Add role checks for `admin`, `engineer`, `approver`, and `supplier`.
- Show an unauthorized state when a user lacks page access.

## Product Management

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
- Build a nested BOM editor.
- Build document upload and revision history screens.
- Build CAD file upload and file reference screens.
- Add API routes for product, part, BOM, document, and CAD CRUD.
- Add search and filtering for products, parts, BOMs, and documents.

## Lifecycle Tracking

- Create database tables for workflows and workflow steps.
- Create database tables for change requests and change items.
- Create database tables for approvals and audit logs.
- Create database tables for quality records and test results.
- Create database tables for certifications and compliance records.
- Build a change request creation flow from product and part pages.
- Build an approval queue page.
- Build a change detail page with impacted records and decisions.
- Implement revision release logic after approval.
- Record audit events for create, edit, approve, reject, and release actions.
- Build compliance tracking pages for standards, evidence, and certifications.
- Build quality tracking pages for findings, actions, and test results.

## Dashboard

- Create a PLM dashboard page.
- Show counts for products, parts, open changes, and pending approvals.
- Show a recent activity feed from audit logs.
- Show upcoming milestones and overdue tasks.
- Show document and CAD revision summaries.
- Add reporting cards for workflow, quality, and compliance status.

## Collaboration

- Create database tables for suppliers and supplier links.
- Create database tables for projects and milestones.
- Create database tables for risks and issues.
- Build a supplier directory page.
- Build supplier sharing for approved documents and drawings.
- Build a project list page.
- Build a milestone tracker.
- Add notifications for approval requests and status changes.
- Add activity comments on change requests and product records.
- Build risk and issue tracking linked to products or projects.
