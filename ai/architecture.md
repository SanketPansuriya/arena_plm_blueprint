# System Architecture

NextGen PLM should be built as a modular monolith for the hackathon: one Next.js application for frontend and server-side APIs, Supabase for auth, Postgres, storage, and row-level security, and a domain model that already includes the PDF's Core Features and key entities. Phase 1 implements the MVP path end to end; Phase 2 and Phase 3 remain architecturally reserved rather than omitted.

## Frontend Structure

- `app/(marketing)`: landing, sign-in, product messaging.
- `app/(app)/dashboard`: KPIs, recent changes, pending approvals, product health summary.
- `app/(app)/products`: products, revisions, linked requirements, specs, configurations, variants.
- `app/(app)/parts`: part library, reuse views, part revisions, supplier/cost summary.
- `app/(app)/boms`: BOM tree, line editor, rolled-up quantity and cost view.
- `app/(app)/documents`: document library, revision history, approvals, file preview.
- `app/(app)/cad`: CAD file list, preview/viewer wrapper, product/part associations.
- `app/(app)/changes`: change requests, impacted items, approvals, release actions.
- `app/(app)/workflows`: workflow templates, step configuration, status monitoring.
- `app/(app)/suppliers`: supplier directory, supplier-facing shared records, quote/update intake later.
- `app/(app)/quality`: quality records, issues, non-conformance, test results.
- `app/(app)/compliance`: certifications, compliance records, evidence, standards mapping.
- `app/(app)/projects`: projects, milestones, risks, issues.
- `app/(app)/search`: cross-entity search and filters.
- `app/(app)/reports`: dashboards and export/report views.
- `app/(app)/admin`: organizations, users, roles, permissions, sites, integrations.

Frontend principles:

- use server components for authenticated page loads and list/detail pages
- use client components for BOM editing, approvals, uploads, workflow actions, and search interactions
- keep entity detail pages tabbed around revisions, linked documents, changes, suppliers, compliance, and audit history
- enforce route protection and session restoration via Supabase middleware
- make mobile approval flows and document lookup work early, even if advanced mobile UX comes later

## Backend Services

- Web App Service:
  - Next.js route handlers and server actions
  - SSR and authenticated data loading
- Auth and Access Service:
  - Supabase Auth
  - org membership, role checks, later permission granularity
- Product Data Service:
  - products, parts, specifications, requirements, revisions
- BOM Service:
  - BOM headers, items, rollups, multi-level relationships
- Document and CAD Service:
  - document revisions, CAD file metadata, storage paths, preview URLs
- Change and Workflow Service:
  - change requests, workflow templates, workflow runs, approvals, release transitions
- Supplier Collaboration Service:
  - supplier records, supplier shares, access scoping, later supplier submissions
- Quality Service:
  - quality records, test results, issues, corrective action hooks
- Compliance Service:
  - certifications, compliance records, standards coverage, evidence links
- Project Delivery Service:
  - projects, milestones, risks, issues
- Cost and Reporting Service:
  - part cost, BOM cost, dashboard aggregates, exports
- Search and Discovery Service:
  - global search endpoint across controlled entities
- Audit and Notification Service:
  - append-only audit logs
  - notifications for workflow and review actions
- Integration API Service:
  - REST endpoints for ERP, MES, CRM, CAD, analytics, and notification integrations

## Database Design Overview

Use Supabase Postgres with row-level security and a normalized schema. Split the model into Phase 1 implemented tables and Phase 2/3 reserved tables.

Phase 1 core tables:

- organizations, users
- products, product_revisions
- parts, part_revisions
- boms, bom_items
- documents, document_revisions
- cad_files, cad_file_revisions
- change_requests, change_items
- workflows, workflow_steps, approvals
- suppliers, supplier_links
- quality_records, test_results
- compliance_records, certifications
- specifications, requirements
- projects, milestones
- audit_logs, notifications

Phase 2 extension tables:

- configurations, variants
- costs, risks, issues
- manufacturing_sites
- saved_searches, reports, dashboard_snapshots

## API Flow

Main request path:

1. User signs in with Supabase Auth.
2. Next.js middleware restores session and protects application routes.
3. Frontend loads data through server components or calls route handlers.
4. Route handler validates organization membership, role, and entity access.
5. Domain service loads or mutates Postgres records and Storage objects.
6. Business events write audit logs and enqueue notifications.
7. Response returns updated entity state for UI refresh.

Main business flow:

1. Create product, requirements, specifications, and base part library.
2. Build product revision and BOM.
3. Upload controlled documents and CAD files.
4. Open change request for impacted entities.
5. Start workflow run and collect approvals.
6. Release revisions and publish supplier/compliance-visible artifacts.
7. Surface results in dashboards, search, audit history, and API responses.

Suggested endpoint groups:

- `/api/auth`
- `/api/organizations`
- `/api/users`
- `/api/products`
- `/api/parts`
- `/api/boms`
- `/api/documents`
- `/api/cad-files`
- `/api/changes`
- `/api/workflows`
- `/api/approvals`
- `/api/suppliers`
- `/api/quality`
- `/api/test-results`
- `/api/compliance`
- `/api/certifications`
- `/api/specifications`
- `/api/requirements`
- `/api/projects`
- `/api/milestones`
- `/api/configurations`
- `/api/variants`
- `/api/costs`
- `/api/risks`
- `/api/issues`
- `/api/search`
- `/api/reports`
- `/api/integrations`
- `/api/notifications`

## MVP Boundaries

- Implement Phase 1 deeply before Phase 2 breadth.
- Keep backend as a modular monolith inside Next.js rather than splitting services.
- Support CAD viewing/reference only, not CAD authoring.
- Start workflow automation with a simple reusable workflow model, not a full low-code engine.
- Reporting, analytics, and search can begin with basic queries and summary endpoints before advanced intelligence.
- Keep Phase 3 innovative features out of the first implementation, but avoid schema choices that block them later.
