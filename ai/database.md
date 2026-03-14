# PostgreSQL Schema for Supabase

This schema is for a multi-tenant PLM platform on Supabase. It now covers the PDF's full key-entity inventory while still marking what should be implemented first. Use `uuid` primary keys, `timestamptz` audit fields, Supabase Auth via `auth.users`, and row-level security by `organization_id`.

## Core Design Rules

- Every tenant-owned table includes `id`, `organization_id`, `created_at`, `updated_at`.
- `public.users.id` references `auth.users.id`.
- Keep files in Supabase Storage; keep metadata, ownership, revision pointers, and checksums in Postgres.
- Model revisions explicitly rather than overwriting controlled records.
- Use text status fields for hackathon speed; enforce valid states in the app and add enums later if needed.
- Build Phase 1 tables first, but keep Phase 2 tables in the schema plan so later work does not require redesign.

## Phase 1 Core Tables

### `organizations`

- `id uuid pk`
- `name text not null`
- `slug text unique not null`
- `industry text`
- `primary_site_name text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `users`

- `id uuid pk references auth.users(id)`
- `organization_id uuid not null references organizations(id)`
- `full_name text`
- `email text not null`
- `role text not null`
- `job_title text`
- `is_active boolean default true`
- `timezone text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `products`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `product_code text not null`
- `name text not null`
- `description text`
- `category text`
- `lifecycle_status text default 'draft'`
- `owner_user_id uuid references users(id)`
- `current_revision_id uuid`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `product_revisions`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `product_id uuid not null references products(id)`
- `revision_code text not null`
- `status text default 'draft'`
- `summary text`
- `change_request_id uuid references change_requests(id)`
- `released_at timestamptz`
- `released_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `parts`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `part_number text not null`
- `name text not null`
- `description text`
- `part_type text`
- `unit_of_measure text`
- `lifecycle_status text default 'draft'`
- `preferred_supplier_id uuid references suppliers(id)`
- `current_revision_id uuid`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `part_revisions`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `part_id uuid not null references parts(id)`
- `revision_code text not null`
- `status text default 'draft'`
- `summary text`
- `specification_id uuid references specifications(id)`
- `cost_id uuid references costs(id)`
- `change_request_id uuid references change_requests(id)`
- `released_at timestamptz`
- `released_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `boms`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `product_revision_id uuid not null references product_revisions(id)`
- `name text not null`
- `status text default 'draft'`
- `notes text`
- `created_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `bom_items`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `bom_id uuid not null references boms(id) on delete cascade`
- `parent_bom_item_id uuid references bom_items(id)`
- `part_revision_id uuid not null references part_revisions(id)`
- `line_number integer not null`
- `quantity numeric(12,4) not null`
- `unit_of_measure text`
- `reference_designator text`
- `notes text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `documents`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `document_number text not null`
- `title text not null`
- `document_type text not null`
- `owner_entity_type text not null`
- `owner_entity_id uuid not null`
- `status text default 'draft'`
- `current_revision_id uuid`
- `created_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `document_revisions`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `document_id uuid not null references documents(id) on delete cascade`
- `revision_code text not null`
- `file_name text not null`
- `storage_bucket text not null`
- `storage_path text not null`
- `mime_type text`
- `file_size_bytes bigint`
- `checksum text`
- `status text default 'draft'`
- `uploaded_by uuid references users(id)`
- `change_request_id uuid references change_requests(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `cad_files`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `cad_number text not null`
- `title text not null`
- `cad_type text`
- `owner_entity_type text not null`
- `owner_entity_id uuid not null`
- `status text default 'draft'`
- `current_revision_id uuid`
- `created_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `cad_file_revisions`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `cad_file_id uuid not null references cad_files(id) on delete cascade`
- `revision_code text not null`
- `file_name text not null`
- `storage_bucket text not null`
- `storage_path text not null`
- `viewer_url text`
- `mime_type text`
- `file_size_bytes bigint`
- `checksum text`
- `status text default 'draft'`
- `uploaded_by uuid references users(id)`
- `change_request_id uuid references change_requests(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `workflows`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `name text not null`
- `workflow_type text not null`
- `is_active boolean default true`
- `created_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `workflow_steps`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `workflow_id uuid not null references workflows(id) on delete cascade`
- `step_order integer not null`
- `name text not null`
- `step_type text`
- `default_role text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `change_requests`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `change_number text not null`
- `title text not null`
- `description text`
- `reason text`
- `impact_summary text`
- `workflow_id uuid references workflows(id)`
- `status text default 'draft'`
- `requested_by uuid not null references users(id)`
- `submitted_at timestamptz`
- `approved_at timestamptz`
- `released_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `change_items`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `change_request_id uuid not null references change_requests(id) on delete cascade`
- `entity_type text not null`
- `entity_id uuid not null`
- `change_action text not null`
- `before_revision text`
- `after_revision text`
- `notes text`
- `created_at timestamptz default now()`

### `approvals`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `change_request_id uuid not null references change_requests(id) on delete cascade`
- `workflow_step_id uuid references workflow_steps(id)`
- `step_order integer not null`
- `step_name text not null`
- `assignee_user_id uuid references users(id)`
- `status text default 'pending'`
- `decision text`
- `decision_notes text`
- `decided_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `suppliers`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `name text not null`
- `supplier_code text`
- `contact_name text`
- `contact_email text`
- `contact_phone text`
- `status text default 'active'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `supplier_links`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `supplier_id uuid not null references suppliers(id) on delete cascade`
- `entity_type text not null`
- `entity_id uuid not null`
- `access_level text default 'view'`
- `expires_at timestamptz`
- `created_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `quality_records`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `product_id uuid references products(id)`
- `part_id uuid references parts(id)`
- `record_type text not null`
- `title text not null`
- `status text default 'open'`
- `description text`
- `owner_user_id uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `test_results`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `quality_record_id uuid references quality_records(id)`
- `product_revision_id uuid references product_revisions(id)`
- `part_revision_id uuid references part_revisions(id)`
- `test_name text not null`
- `result_status text not null`
- `measured_value text`
- `unit text`
- `executed_at timestamptz`
- `executed_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `specifications`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `spec_code text`
- `title text not null`
- `description text`
- `owner_entity_type text not null`
- `owner_entity_id uuid not null`
- `status text default 'draft'`
- `created_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `requirements`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `requirement_code text`
- `title text not null`
- `description text`
- `requirement_type text`
- `priority text`
- `owner_entity_type text not null`
- `owner_entity_id uuid not null`
- `status text default 'draft'`
- `created_by uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `projects`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `name text not null`
- `description text`
- `status text default 'active'`
- `owner_user_id uuid references users(id)`
- `start_date date`
- `target_date date`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `milestones`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `project_id uuid not null references projects(id) on delete cascade`
- `title text not null`
- `status text default 'planned'`
- `due_date date`
- `completed_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `certifications`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `certification_code text`
- `name text not null`
- `issuing_body text`
- `status text default 'active'`
- `valid_from date`
- `valid_to date`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `compliance_records`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `standard_name text not null`
- `status text not null`
- `certification_id uuid references certifications(id)`
- `evidence_document_id uuid references documents(id)`
- `notes text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `audit_logs`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `actor_user_id uuid references users(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `action text not null`
- `before_data jsonb`
- `after_data jsonb`
- `metadata jsonb`
- `created_at timestamptz default now()`

### `notifications`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `user_id uuid not null references users(id)`
- `event_type text not null`
- `entity_type text not null`
- `entity_id uuid not null`
- `title text not null`
- `message text`
- `read_at timestamptz`
- `created_at timestamptz default now()`

## Phase 2 Extension Tables

### `configurations`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `product_id uuid not null references products(id)`
- `configuration_code text not null`
- `name text not null`
- `status text default 'draft'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `variants`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `product_id uuid not null references products(id)`
- `configuration_id uuid references configurations(id)`
- `variant_code text not null`
- `name text not null`
- `status text default 'draft'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `costs`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `cost_type text not null`
- `amount numeric(12,2) not null`
- `currency text not null default 'USD'`
- `effective_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `risks`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `title text not null`
- `description text`
- `likelihood text`
- `impact text`
- `mitigation text`
- `status text default 'open'`
- `owner_user_id uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `issues`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `entity_type text not null`
- `entity_id uuid not null`
- `title text not null`
- `description text`
- `severity text`
- `status text default 'open'`
- `owner_user_id uuid references users(id)`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

### `manufacturing_sites`

- `id uuid pk`
- `organization_id uuid not null references organizations(id)`
- `name text not null`
- `site_code text`
- `location text`
- `status text default 'active'`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

## Relationships Overview

- `organizations 1 -> many users, products, parts, documents, cad_files, changes, workflows, suppliers, projects`
- `products 1 -> many product_revisions`
- `parts 1 -> many part_revisions`
- `product_revisions 1 -> 1 boms`
- `boms 1 -> many bom_items`
- `documents 1 -> many document_revisions`
- `cad_files 1 -> many cad_file_revisions`
- `workflows 1 -> many workflow_steps`
- `change_requests 1 -> many change_items`
- `change_requests 1 -> many approvals`
- `suppliers 1 -> many supplier_links`
- `quality_records 1 -> many test_results`
- `projects 1 -> many milestones`
- `products 1 -> many configurations`
- `configurations 1 -> many variants`

## Important Foreign-Key Pointers

- `products.current_revision_id -> product_revisions.id`
- `parts.current_revision_id -> part_revisions.id`
- `documents.current_revision_id -> document_revisions.id`
- `cad_files.current_revision_id -> cad_file_revisions.id`
- `product_revisions.change_request_id -> change_requests.id`
- `part_revisions.change_request_id -> change_requests.id`
- `document_revisions.change_request_id -> change_requests.id`
- `cad_file_revisions.change_request_id -> change_requests.id`
- `approvals.workflow_step_id -> workflow_steps.id`
- `part_revisions.specification_id -> specifications.id`
- `part_revisions.cost_id -> costs.id`

## Recommended Constraints and Indexes

- unique `(organization_id, product_code)` on `products`
- unique `(organization_id, part_number)` on `parts`
- unique `(organization_id, document_number)` on `documents`
- unique `(organization_id, cad_number)` on `cad_files`
- unique `(organization_id, change_number)` on `change_requests`
- unique `(product_id, revision_code)` on `product_revisions`
- unique `(part_id, revision_code)` on `part_revisions`
- unique `(document_id, revision_code)` on `document_revisions`
- unique `(cad_file_id, revision_code)` on `cad_file_revisions`
- unique `(workflow_id, step_order)` on `workflow_steps`
- unique `(bom_id, line_number)` on `bom_items`
- index every `organization_id`
- index `(organization_id, status)` on controlled lifecycle tables
- index `entity_type, entity_id` on polymorphic link tables such as compliance, costs, risks, issues, notifications, audit logs

## Supabase Notes

- Enable RLS on all tenant-owned tables.
- Policies should allow only rows where `organization_id` matches the signed-in user profile.
- Use Storage buckets such as `documents`, `cad-files`, and optionally `exports`.
- Add trigger-based `updated_at` maintenance.
- Add trigger or app logic to update `current_revision_id` after a new released revision is promoted.
- Start implementation with Phase 1 tables; Phase 2 tables can be stubbed or migrated later without changing the overall model.
