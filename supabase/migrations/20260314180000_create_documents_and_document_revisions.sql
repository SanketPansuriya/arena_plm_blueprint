create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_number text not null,
  title text not null,
  document_type text not null,
  owner_entity_type text not null,
  owner_entity_id uuid not null,
  status text not null default 'draft',
  current_revision_id uuid,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint documents_organization_id_document_number_key unique (organization_id, document_number)
);

create table public.document_revisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  revision_code text not null,
  file_name text not null,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint,
  checksum text,
  status text not null default 'draft',
  uploaded_by uuid references public.users (id) on delete set null,
  change_request_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint document_revisions_organization_id_document_id_revision_code_key unique (
    organization_id,
    document_id,
    revision_code
  )
);

alter table public.documents
add constraint documents_current_revision_id_fkey
foreign key (current_revision_id)
references public.document_revisions (id)
on delete set null;

create index documents_organization_id_idx
  on public.documents (organization_id);

create index documents_owner_entity_idx
  on public.documents (owner_entity_type, owner_entity_id);

create index documents_current_revision_id_idx
  on public.documents (current_revision_id);

create index documents_created_by_idx
  on public.documents (created_by);

create index document_revisions_organization_id_idx
  on public.document_revisions (organization_id);

create index document_revisions_document_id_idx
  on public.document_revisions (document_id);

create index document_revisions_uploaded_by_idx
  on public.document_revisions (uploaded_by);

create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

create trigger set_document_revisions_updated_at
before update on public.document_revisions
for each row
execute function public.set_updated_at();

alter table public.documents enable row level security;
alter table public.document_revisions enable row level security;

create policy "Documents are viewable by active organization members"
on public.documents
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Documents are insertable by active organization members"
on public.documents
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Documents are updatable by active organization members"
on public.documents
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Documents are deletable by active organization members"
on public.documents
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Document revisions are viewable by active organization members"
on public.document_revisions
for select
to authenticated
using (public.is_active_member_of_organization(organization_id));

create policy "Document revisions are insertable by active organization members"
on public.document_revisions
for insert
to authenticated
with check (public.is_active_member_of_organization(organization_id));

create policy "Document revisions are updatable by active organization members"
on public.document_revisions
for update
to authenticated
using (public.is_active_member_of_organization(organization_id))
with check (public.is_active_member_of_organization(organization_id));

create policy "Document revisions are deletable by active organization members"
on public.document_revisions
for delete
to authenticated
using (public.is_active_member_of_organization(organization_id));
